const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get admin dashboard statistics
router.get('/dashboard', authMiddleware(['admin']), async (req, res) => {
  try {
    const [
      totalTeams,
      totalPlayers,
      totalMatches,
      totalTournaments,
      liveMatches,
      upcomingMatches,
      recentMatches,
      recentPlayers
    ] = await Promise.all([
      Team.countDocuments({ isActive: true }),
      Player.countDocuments({ isActive: true }),
      Match.countDocuments({ isActive: true }),
      Tournament.countDocuments({ isActive: true }),
      Match.find({ 
        status: { $in: ['live', 'toss', 'innings-break'] },
        isActive: true 
      })
      .populate('team1 team2', 'name teamId')
      .limit(5),
      Match.find({ 
        status: 'scheduled',
        date: { $gte: new Date() },
        isActive: true 
      })
      .populate('team1 team2', 'name teamId')
      .sort({ date: 1 })
      .limit(5),
      Match.find({ 
        status: 'completed',
        isActive: true 
      })
      .populate('team1 team2 result.winner', 'name teamId')
      .sort({ date: -1 })
      .limit(5),
      Player.find({ isActive: true })
      .populate('team', 'name teamId')
      .sort({ createdAt: -1 })
      .limit(10)
    ]);

    // Get points table
    const pointsTable = await Team.find({ isActive: true })
      .select('name teamId group matchesPlayed matchesWon matchesLost points netRunRate')
      .sort({ points: -1, netRunRate: -1 })
      .limit(8);

    res.json({
      statistics: {
        totalTeams,
        totalPlayers,
        totalMatches,
        totalTournaments,
        liveMatches: liveMatches.length,
        upcomingMatches: upcomingMatches.length
      },
      liveMatches,
      upcomingMatches,
      recentMatches,
      recentPlayers,
      pointsTable,
      quickActions: [
        { label: 'Create Team', path: '/admin/teams/create', icon: 'team' },
        { label: 'Add Player', path: '/admin/players/create', icon: 'player' },
        { label: 'Schedule Match', path: '/admin/matches/create', icon: 'match' },
        { label: 'Update Toss', path: '/admin/matches/toss', icon: 'toss' },
        { label: 'Start Scoring', path: '/admin/scoring', icon: 'scoring' },
        { label: 'Generate Fixtures', path: '/admin/fixtures', icon: 'fixtures' }
      ]
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/users', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (Admin only)
router.post('/users', authMiddleware(['admin']), [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'scorer', 'viewer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this username or email already exists' 
      });
    }

    const newUser = new User({
      username,
      email,
      password,
      role,
      createdBy: req.user._id
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (Admin only)
router.put('/users/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, email, role, isActive } = req.body;
    
    // Check if updating to existing username/email
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username already taken' 
        });
      }
      user.username = username;
    }
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already registered' 
        });
      }
      user.email = email;
    }
    
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (Admin only - soft delete)
router.delete('/users/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk operations
router.post('/bulk/teams', authMiddleware(['admin']), async (req, res) => {
  try {
    const { teams } = req.body;
    
    if (!Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ 
        message: 'Teams array is required' 
      });
    }

    const results = [];
    
    for (const teamData of teams) {
      try {
        // Check if team exists
        const existingTeam = await Team.findOne({ 
          teamId: teamData.teamId.toUpperCase() 
        });
        
        if (existingTeam) {
          results.push({
            teamId: teamData.teamId,
            status: 'skipped',
            message: 'Team already exists'
          });
          continue;
        }

        const newTeam = new Team({
          ...teamData,
          teamId: teamData.teamId.toUpperCase(),
          shortName: teamData.shortName.toUpperCase(),
          createdBy: req.user._id
        });

        await newTeam.save();
        
        results.push({
          teamId: teamData.teamId,
          status: 'created',
          message: 'Team created successfully'
        });
      } catch (error) {
        results.push({
          teamId: teamData.teamId,
          status: 'error',
          message: error.message
        });
      }
    }

    res.json({
      message: 'Bulk operation completed',
      results
    });

  } catch (error) {
    console.error('Bulk teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system logs (placeholder)
router.get('/logs', authMiddleware(['admin']), async (req, res) => {
  try {
    // In a real application, you would have a logging system
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System started',
        user: req.user.username
      }
    ];

    res.json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Backup database (placeholder - in production use proper backup)
router.post('/backup', authMiddleware(['admin']), async (req, res) => {
  try {
    // This is a placeholder for backup functionality
    // In production, implement proper database backup
    const backupInfo = {
      timestamp: new Date(),
      collections: ['teams', 'players', 'matches', 'tournaments', 'users'],
      status: 'backup_initiated',
      estimatedSize: 'Not calculated'
    };

    res.json({
      message: 'Backup initiated successfully',
      backupInfo
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system health
router.get('/health', authMiddleware(['admin']), async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      database: dbStatus,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      },
      uptime: `${Math.floor(uptime / 60)} minutes`,
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

module.exports = router;