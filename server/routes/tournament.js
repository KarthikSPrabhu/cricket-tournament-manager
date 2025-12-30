const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get current tournament
router.get('/current', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      status: 'ongoing',
      isActive: true
    })
    .populate('groups.teams', 'name teamId logo points')
    .sort({ year: -1 });
    
    if (!tournament) {
      // Get the most recent tournament
      const recentTournament = await Tournament.findOne({ isActive: true })
        .sort({ year: -1 });
      
      return res.json(recentTournament || { message: 'No tournament found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Get current tournament error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find({ isActive: true })
      .sort({ year: -1 });
    
    res.json(tournaments);
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single tournament
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('groups.teams', 'name teamId logo points matchesPlayed matchesWon matchesLost netRunRate');
    
    if (!tournament || !tournament.isActive) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create tournament (Admin only)
router.post('/', authMiddleware(['admin']), [
  body('name').notEmpty().withMessage('Tournament name is required'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('format').isIn(['knockout', 'league', 'group+knockout'])
    .withMessage('Invalid tournament format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      year,
      description,
      logo,
      startDate,
      endDate,
      format,
      rules
    } = req.body;

    // Check if tournament already exists for this year
    const existingTournament = await Tournament.findOne({
      year,
      isActive: true
    });
    
    if (existingTournament) {
      return res.status(400).json({
        message: 'Tournament for this year already exists'
      });
    }

    const newTournament = new Tournament({
      name,
      year,
      description,
      logo,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
      rules: rules || {
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerNoResult: 1,
        superOver: true,
        dlsMethod: true,
        powerplayOvers: 6
      },
      status: 'upcoming',
      createdBy: req.user._id
    });

    await newTournament.save();

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament: newTournament
    });

  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update tournament (Admin only)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament || !tournament.isActive) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && tournament[key] !== undefined) {
        tournament[key] = updates[key];
      }
    });

    await tournament.save();

    res.json({
      message: 'Tournament updated successfully',
      tournament
    });

  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create groups (Admin only)
router.post('/:id/groups', authMiddleware(['admin']), [
  body('groups').isArray().withMessage('Groups array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || !tournament.isActive) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const { groups } = req.body;
    
    // Validate each group
    for (const group of groups) {
      if (!group.name || !group.teamIds || !Array.isArray(group.teamIds)) {
        return res.status(400).json({ 
          message: 'Each group must have name and teamIds array' 
        });
      }
      
      // Verify all teams exist
      for (const teamId of group.teamIds) {
        const team = await Team.findOne({
          $or: [
            { _id: teamId },
            { teamId: teamId.toUpperCase() }
          ],
          isActive: true
        });
        
        if (!team) {
          return res.status(404).json({ 
            message: `Team ${teamId} not found` 
          });
        }
        
        // Update team group
        team.group = group.name;
        await team.save();
      }
    }

    tournament.groups = groups.map(group => ({
      name: group.name,
      teams: group.teamIds
    }));

    await tournament.save();

    res.json({
      message: 'Groups created successfully',
      tournament: await tournament.populate('groups.teams', 'name teamId logo')
    });

  } catch (error) {
    console.error('Create groups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate fixtures (Admin only)
router.post('/:id/fixtures', authMiddleware(['admin']), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || !tournament.isActive) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!tournament.groups || tournament.groups.length === 0) {
      return res.status(400).json({ 
        message: 'Please create groups first' 
      });
    }

    const { startDate, daysBetweenMatches = 1, matchesPerDay = 2 } = req.body;
    const fixtures = [];
    let matchDate = new Date(startDate);
    let matchNumber = 1;

    // Generate group stage matches
    for (const group of tournament.groups) {
      const teams = group.teams;
      
      // Generate round-robin matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const matchId = `MATCH${matchNumber.toString().padStart(3, '0')}`;
          
          fixtures.push({
            matchId,
            matchNumber,
            tournament: tournament._id,
            team1: teams[i],
            team2: teams[j],
            venue: 'Main Stadium', // Default venue
            date: new Date(matchDate),
            startTime: '10:00 AM',
            matchType: 'group',
            status: 'scheduled',
            overs: tournament.rules?.powerplayOvers ? 20 : 50 // T20 or ODI
          });

          matchNumber++;
          
          // Alternate match times
          if (fixtures.length % matchesPerDay === 0) {
            matchDate.setDate(matchDate.getDate() + daysBetweenMatches);
          }
        }
      }
    }

    // Create matches in database
    const createdMatches = [];
    for (const fixture of fixtures) {
      const match = new Match(fixture);
      await match.save();
      createdMatches.push(match);
    }

    tournament.status = 'ongoing';
    await tournament.save();

    res.json({
      message: 'Fixtures generated successfully',
      count: createdMatches.length,
      matches: createdMatches
    });

  } catch (error) {
    console.error('Generate fixtures error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tournament statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament || !tournament.isActive) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Get all matches in tournament
    const matches = await Match.find({
      tournament: tournament._id,
      isActive: true
    })
    .populate('team1 team2', 'name teamId')
    .populate('result.playerOfMatch', 'name playerId');

    // Get all teams
    const teams = await Team.find({
      _id: { $in: tournament.groups.flatMap(g => g.teams) },
      isActive: true
    });

    // Calculate statistics
    const stats = {
      totalMatches: matches.length,
      completedMatches: matches.filter(m => m.status === 'completed').length,
      upcomingMatches: matches.filter(m => m.status === 'scheduled').length,
      liveMatches: matches.filter(m => m.status === 'live').length,
      totalTeams: teams.length,
      totalRuns: matches.reduce((sum, match) => {
        return sum + (match.innings?.[0]?.totalRuns || 0) + 
                     (match.innings?.[1]?.totalRuns || 0);
      }, 0),
      totalWickets: matches.reduce((sum, match) => {
        return sum + (match.innings?.[0]?.totalWickets || 0) + 
                     (match.innings?.[1]?.totalWickets || 0);
      }, 0),
      totalSixes: 0, // Would need to calculate from ball-by-ball data
      totalFours: 0, // Would need to calculate from ball-by-ball data
      highestScore: {
        runs: 0,
        team: null,
        match: null
      },
      bestBowling: {
        wickets: 0,
        runs: 0,
        player: null,
        match: null
      },
      playersOfMatch: matches
        .filter(m => m.result?.playerOfMatch)
        .map(m => ({
          player: m.result.playerOfMatch,
          match: m.matchId
        }))
    };

    res.json({
      tournament,
      stats
    });

  } catch (error) {
    console.error('Get tournament stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete tournament (Admin only - soft delete)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Soft delete
    tournament.isActive = false;
    await tournament.save();

    // Also soft delete all matches in this tournament
    await Match.updateMany(
      { tournament: tournament._id },
      { isActive: false }
    );

    res.json({
      message: 'Tournament deleted successfully'
    });

  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;