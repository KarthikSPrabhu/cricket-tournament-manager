const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('captain', 'name playerId')
      .populate('viceCaptain', 'name playerId')
      .populate('players', 'name playerId playingRole')
      .sort({ group: 1, points: -1, netRunRate: -1 });
    
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single team
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findOne({ 
      $or: [
        { _id: req.params.id },
        { teamId: req.params.id.toUpperCase() }
      ],
      isActive: true 
    })
    .populate('captain')
    .populate('viceCaptain')
    .populate('players');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create team (Admin only)
router.post('/', authMiddleware(['admin']), [
  body('teamId').notEmpty().withMessage('Team ID is required'),
  body('name').notEmpty().withMessage('Team name is required'),
  body('shortName').notEmpty().withMessage('Short name is required'),
  body('group').optional().isIn(['A', 'B', 'C', 'D', null])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teamId, name, shortName, logo, group, coach } = req.body;
    
    // Check if team already exists
    const existingTeam = await Team.findOne({ 
      $or: [{ teamId: teamId.toUpperCase() }, { name }] 
    });
    
    if (existingTeam) {
      return res.status(400).json({ 
        message: 'Team with this ID or name already exists' 
      });
    }

    const newTeam = new Team({
      teamId: teamId.toUpperCase(),
      name,
      shortName: shortName.toUpperCase(),
      logo,
      group,
      coach,
      createdBy: req.user._id
    });

    await newTeam.save();

    res.status(201).json({
      message: 'Team created successfully',
      team: newTeam
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team (Admin only)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'teamId' && key !== '_id') {
        team[key] = updates[key];
      }
    });

    await team.save();

    res.json({
      message: 'Team updated successfully',
      team
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete team (Admin only - soft delete)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Soft delete
    team.isActive = false;
    await team.save();

    // Also deactivate all players
    await Player.updateMany(
      { team: team._id },
      { isActive: false }
    );

    res.json({
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add player to team (Admin only)
router.post('/:id/players', authMiddleware(['admin']), [
  body('playerId').notEmpty().withMessage('Player ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const player = await Player.findOne({ 
      playerId: req.body.playerId.toUpperCase() 
    });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Check if player already in team
    if (team.players.includes(player._id)) {
      return res.status(400).json({ message: 'Player already in team' });
    }

    // Add player to team
    team.players.push(player._id);
    
    // Update player's team reference
    player.team = team._id;
    await player.save();
    await team.save();

    res.json({
      message: 'Player added to team successfully',
      team
    });

  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove player from team (Admin only)
router.delete('/:teamId/players/:playerId', authMiddleware(['admin']), async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Remove player from team
    team.players = team.players.filter(
      playerId => playerId.toString() !== player._id.toString()
    );
    
    // Remove team reference from player
    player.team = null;
    await player.save();
    await team.save();

    res.json({
      message: 'Player removed from team successfully'
    });

  } catch (error) {
    console.error('Remove player error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get team players
router.get('/:id/players', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate({
        path: 'players',
        match: { isActive: true },
        select: 'name playerId age playingRole battingStyle bowlingStyle photo'
      });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team.players);
  } catch (error) {
    console.error('Get team players error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get points table
router.get('/points-table/all', async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .select('teamId name shortName logo group matchesPlayed matchesWon matchesLost matchesTied matchesNoResult points netRunRate totalRunsScored totalOversFaced totalRunsConceded totalOversBowled')
      .sort({ group: 1, points: -1, netRunRate: -1 });
    
    // Format for points table
    const pointsTable = teams.map(team => ({
      ...team.toObject(),
      winPercentage: team.matchesPlayed > 0 
        ? ((team.matchesWon / team.matchesPlayed) * 100).toFixed(2)
        : '0.00'
    }));

    res.json(pointsTable);
  } catch (error) {
    console.error('Get points table error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;