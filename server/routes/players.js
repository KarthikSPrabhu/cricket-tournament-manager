const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all players
router.get('/', async (req, res) => {
  try {
    const { team, role, search } = req.query;
    let query = { isActive: true };
    
    if (team) {
      const teamDoc = await Team.findOne({ 
        $or: [
          { _id: team },
          { teamId: team.toUpperCase() }
        ]
      });
      if (teamDoc) {
        query.team = teamDoc._id;
      }
    }
    
    if (role) {
      query.playingRole = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { playerId: { $regex: search.toUpperCase(), $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const players = await Player.find(query)
      .populate('team', 'name teamId logo')
      .sort({ name: 1 });
    
    res.json(players);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single player
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findOne({
      $or: [
        { _id: req.params.id },
        { playerId: req.params.id.toUpperCase() }
      ],
      isActive: true
    }).populate('team', 'name teamId logo');
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create player (Admin only)
router.post('/', authMiddleware(['admin']), [
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('name').notEmpty().withMessage('Player name is required'),
  body('teamId').notEmpty().withMessage('Team ID is required'),
  body('age').isInt({ min: 16, max: 50 }).withMessage('Age must be between 16 and 50'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('playingRole').isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'wicket-keeper-batsman'])
    .withMessage('Invalid playing role'),
  body('battingStyle').optional().isIn(['right-hand', 'left-hand', null]),
  body('bowlingStyle').optional().isIn([
    'right-arm fast', 'right-arm medium', 'right-arm spin',
    'left-arm fast', 'left-arm medium', 'left-arm spin', null
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      playerId,
      name,
      teamId,
      age,
      phoneNumber,
      email,
      playingRole,
      battingStyle,
      bowlingStyle,
      photo
    } = req.body;

    // Check if player already exists
    const existingPlayer = await Player.findOne({
      $or: [
        { playerId: playerId.toUpperCase() },
        { email }
      ]
    });
    
    if (existingPlayer) {
      return res.status(400).json({
        message: 'Player with this ID or email already exists'
      });
    }

    // Find team
    const team = await Team.findOne({
      $or: [
        { _id: teamId },
        { teamId: teamId.toUpperCase() }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Create new player
    const newPlayer = new Player({
      playerId: playerId.toUpperCase(),
      name,
      team: team._id,
      age,
      phoneNumber,
      email: email.toLowerCase(),
      playingRole,
      battingStyle: battingStyle || null,
      bowlingStyle: bowlingStyle || null,
      photo,
      createdBy: req.user._id
    });

    await newPlayer.save();

    // Add player to team if not already added
    if (!team.players.includes(newPlayer._id)) {
      team.players.push(newPlayer._id);
      await team.save();
    }

    res.status(201).json({
      message: 'Player created successfully',
      player: await newPlayer.populate('team', 'name teamId logo')
    });

  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update player (Admin only)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Check if updating to existing email
    if (req.body.email && req.body.email !== player.email) {
      const existingPlayer = await Player.findOne({ 
        email: req.body.email.toLowerCase() 
      });
      if (existingPlayer) {
        return res.status(400).json({ 
          message: 'Player with this email already exists' 
        });
      }
    }

    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'playerId' && key !== '_id' && key !== 'team') {
        player[key] = updates[key];
      }
    });

    // If updating team
    if (updates.teamId) {
      const newTeam = await Team.findOne({
        $or: [
          { _id: updates.teamId },
          { teamId: updates.teamId.toUpperCase() }
        ]
      });
      
      if (!newTeam) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Remove from old team
      const oldTeam = await Team.findById(player.team);
      if (oldTeam) {
        oldTeam.players = oldTeam.players.filter(
          pId => pId.toString() !== player._id.toString()
        );
        await oldTeam.save();
      }

      // Add to new team
      player.team = newTeam._id;
      if (!newTeam.players.includes(player._id)) {
        newTeam.players.push(player._id);
        await newTeam.save();
      }
    }

    await player.save();

    res.json({
      message: 'Player updated successfully',
      player: await player.populate('team', 'name teamId logo')
    });

  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete player (Admin only - soft delete)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Soft delete
    player.isActive = false;
    await player.save();

    // Remove from team
    const team = await Team.findById(player.team);
    if (team) {
      team.players = team.players.filter(
        pId => pId.toString() !== player._id.toString()
      );
      await team.save();
    }

    res.json({
      message: 'Player deleted successfully'
    });

  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update player stats (Admin/Scorer only)
router.put('/:id/stats', authMiddleware(['admin', 'scorer']), [
  body('type').isIn(['batting', 'bowling', 'fielding']).withMessage('Invalid stat type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const { type, data } = req.body;

    switch (type) {
      case 'batting':
        player.battingStats = { ...player.battingStats, ...data };
        break;
      case 'bowling':
        player.bowlingStats = { ...player.bowlingStats, ...data };
        break;
      case 'fielding':
        player.fieldingStats = { ...player.fieldingStats, ...data };
        break;
    }

    await player.save();

    res.json({
      message: 'Player stats updated successfully',
      player
    });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get player statistics leaderboard
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    let sortCriteria = {};
    let projection = {};
    
    switch (type) {
      case 'batting-runs':
        sortCriteria = { 'battingStats.runs': -1 };
        projection = 'name playerId team battingStats.runs battingStats.average battingStats.strikeRate';
        break;
      case 'batting-average':
        sortCriteria = { 'battingStats.battingAverage': -1 };
        projection = 'name playerId team battingStats.battingAverage battingStats.runs battingStats.innings';
        break;
      case 'bowling-wickets':
        sortCriteria = { 'bowlingStats.wickets': -1 };
        projection = 'name playerId team bowlingStats.wickets bowlingStats.average bowlingStats.economy';
        break;
      case 'bowling-economy':
        sortCriteria = { 'bowlingStats.economy': 1 };
        projection = 'name playerId team bowlingStats.economy bowlingStats.wickets bowlingStats.overs';
        break;
      default:
        return res.status(400).json({ message: 'Invalid stat type' });
    }

    const leaderboard = await Player.find({ isActive: true })
      .populate('team', 'name teamId')
      .select(projection)
      .sort(sortCriteria)
      .limit(parseInt(limit));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search players
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const players = await Player.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { playerId: { $regex: query.toUpperCase(), $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
    .populate('team', 'name teamId')
    .limit(20);

    res.json(players);
  } catch (error) {
    console.error('Search players error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;