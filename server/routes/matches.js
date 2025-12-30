const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Team = require('../models/Team');
const Player = require('../models/Player');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { status, team, dateFrom, dateTo, tournament } = req.query;
    let query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (team) {
      const teamDoc = await Team.findOne({
        $or: [
          { _id: team },
          { teamId: team.toUpperCase() }
        ]
      });
      if (teamDoc) {
        query.$or = [
          { team1: teamDoc._id },
          { team2: teamDoc._id }
        ];
      }
    }
    
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    
    if (tournament) {
      query.tournament = tournament;
    }
    
    const matches = await Match.find(query)
      .populate('team1', 'name teamId logo')
      .populate('team2', 'name teamId logo')
      .populate('toss.winner', 'name teamId')
      .populate('result.winner', 'name teamId')
      .populate('result.playerOfMatch', 'name playerId')
      .sort({ date: 1, startTime: 1 });
    
    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const liveMatches = await Match.find({
      status: { $in: ['live', 'toss', 'innings-break'] },
      isActive: true
    })
    .populate('team1', 'name teamId logo')
    .populate('team2', 'name teamId logo')
    .sort({ date: 1, startTime: 1 });
    
    res.json(liveMatches);
  } catch (error) {
    console.error('Get live matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming matches
router.get('/upcoming', async (req, res) => {
  try {
    const upcomingMatches = await Match.find({
      status: 'scheduled',
      date: { $gte: new Date() },
      isActive: true
    })
    .populate('team1', 'name teamId logo')
    .populate('team2', 'name teamId logo')
    .sort({ date: 1, startTime: 1 })
    .limit(10);
    
    res.json(upcomingMatches);
  } catch (error) {
    console.error('Get upcoming matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get completed matches
router.get('/completed', async (req, res) => {
  try {
    const completedMatches = await Match.find({
      status: 'completed',
      isActive: true
    })
    .populate('team1', 'name teamId logo')
    .populate('team2', 'name teamId logo')
    .populate('result.winner', 'name teamId')
    .populate('result.playerOfMatch', 'name playerId')
    .sort({ date: -1 })
    .limit(20);
    
    res.json(completedMatches);
  } catch (error) {
    console.error('Get completed matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single match with full details
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findOne({
      $or: [
        { _id: req.params.id },
        { matchId: req.params.id.toUpperCase() }
      ],
      isActive: true
    })
    .populate('team1', 'name teamId logo')
    .populate('team2', 'name teamId logo')
    .populate('toss.winner', 'name teamId')
    .populate('result.winner', 'name teamId')
    .populate('result.playerOfMatch', 'name playerId')
    .populate({
      path: 'innings',
      populate: [
        {
          path: 'team',
          select: 'name teamId'
        },
        {
          path: 'batting.player',
          select: 'name playerId photo'
        },
        {
          path: 'bowling.player',
          select: 'name playerId photo'
        },
        {
          path: 'balls.bowler',
          select: 'name playerId'
        },
        {
          path: 'balls.batsman',
          select: 'name playerId'
        },
        {
          path: 'balls.nonStriker',
          select: 'name playerId'
        },
        {
          path: 'balls.fielder',
          select: 'name playerId'
        }
      ]
    });
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json(match);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create match (Admin only)
router.post('/', authMiddleware(['admin']), [
  body('matchId').notEmpty().withMessage('Match ID is required'),
  body('team1Id').notEmpty().withMessage('Team 1 ID is required'),
  body('team2Id').notEmpty().withMessage('Team 2 ID is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('overs').optional().isInt({ min: 5, max: 50 }),
  body('matchType').optional().isIn(['group', 'quarter-final', 'semi-final', 'final'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      matchId,
      team1Id,
      team2Id,
      venue,
      date,
      startTime,
      overs,
      matchType,
      umpires,
      streamLink
    } = req.body;

    // Check if match already exists
    const existingMatch = await Match.findOne({ 
      matchId: matchId.toUpperCase() 
    });
    
    if (existingMatch) {
      return res.status(400).json({
        message: 'Match with this ID already exists'
      });
    }

    // Find teams
    const team1 = await Team.findOne({
      $or: [
        { _id: team1Id },
        { teamId: team1Id.toUpperCase() }
      ]
    });
    
    const team2 = await Team.findOne({
      $or: [
        { _id: team2Id },
        { teamId: team2Id.toUpperCase() }
      ]
    });
    
    if (!team1 || !team2) {
      return res.status(404).json({ 
        message: 'One or both teams not found' 
      });
    }

    // Check if teams are same
    if (team1._id.toString() === team2._id.toString()) {
      return res.status(400).json({ 
        message: 'Team 1 and Team 2 cannot be the same' 
      });
    }

    // Get next match number
    const lastMatch = await Match.findOne().sort({ matchNumber: -1 });
    const matchNumber = lastMatch ? lastMatch.matchNumber + 1 : 1;

    // Create new match
    const newMatch = new Match({
      matchId: matchId.toUpperCase(),
      matchNumber,
      team1: team1._id,
      team2: team2._id,
      venue,
      date: new Date(date),
      startTime,
      overs: overs || 20,
      matchType: matchType || 'group',
      umpires: umpires || {},
      streamLink,
      createdBy: req.user._id,
      innings: [] // Start with empty innings
    });

    await newMatch.save();

    res.status(201).json({
      message: 'Match created successfully',
      match: await newMatch.populate('team1 team2', 'name teamId logo')
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update match status (Admin/Scorer only)
router.put('/:id/status', authMiddleware(['admin', 'scorer']), [
  body('status').isIn(['scheduled', 'toss', 'live', 'innings-break', 'completed', 'abandoned', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { status, tossWinner, tossDecision } = req.body;
    
    match.status = status;
    
    // Handle toss update
    if (status === 'toss' && tossWinner) {
      const winner = await Team.findOne({
        $or: [
          { _id: tossWinner },
          { teamId: tossWinner.toUpperCase() }
        ]
      });
      
      if (winner) {
        match.toss.winner = winner._id;
        match.toss.decision = tossDecision || null;
      }
    }
    
    // Handle start of innings
    if (status === 'live' && !match.innings.length) {
      // Create first innings
      const battingTeam = match.toss.decision === 'bat' 
        ? match.toss.winner 
        : (match.toss.winner.toString() === match.team1.toString() 
            ? match.team2 
            : match.team1);
      
      match.innings.push({
        team: battingTeam,
        batting: [],
        bowling: [],
        extras: {
          wides: 0,
          noBalls: 0,
          byes: 0,
          legByes: 0,
          penalty: 0
        },
        currentOver: [],
        completed: false
      });
      
      match.currentInnings = 1;
    }
    
    await match.save();

    res.json({
      message: 'Match status updated successfully',
      match: await match.populate('team1 team2 toss.winner', 'name teamId')
    });

  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add ball to match (Scorer only)
router.post('/:id/balls', authMiddleware(['admin', 'scorer']), [
  body('overNumber').isFloat({ min: 0 }).withMessage('Valid over number is required'),
  body('ballNumber').isInt({ min: 1, max: 7 }).withMessage('Valid ball number is required'),
  body('bowlerId').notEmpty().withMessage('Bowler ID is required'),
  body('batsmanId').notEmpty().withMessage('Batsman ID is required'),
  body('runs').isInt({ min: 0 }).withMessage('Valid runs required'),
  body('extras').optional().isInt({ min: 0 }),
  body('extraType').optional().isIn(['wide', 'no-ball', 'bye', 'leg-bye', 'penalty', null]),
  body('wicket').optional().isBoolean(),
  body('wicketType').optional().isIn(['bowled', 'caught', 'lbw', 'run-out', 'stumped', 'hit-wicket', 'retired', null]),
  body('fielderId').optional(),
  body('commentary').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'live') {
      return res.status(400).json({ message: 'Match is not live' });
    }

    const currentInnings = match.innings[match.currentInnings - 1];
    if (!currentInnings) {
      return res.status(400).json({ message: 'No innings in progress' });
    }

    const {
      overNumber,
      ballNumber,
      bowlerId,
      batsmanId,
      nonStrikerId,
      runs,
      extras = 0,
      extraType,
      wicket = false,
      wicketType,
      fielderId,
      commentary
    } = req.body;

    // Find players
    const bowler = await Player.findById(bowlerId);
    const batsman = await Player.findById(batsmanId);
    const nonStriker = nonStrikerId ? await Player.findById(nonStrikerId) : null;
    const fielder = fielderId ? await Player.findById(fielderId) : null;

    if (!bowler || !batsman) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Create ball data
    const ballData = {
      ballNumber,
      overNumber,
      bowler: bowler._id,
      batsman: batsman._id,
      nonStriker: nonStriker?._id,
      runs,
      extras: extraType ? extras : 0,
      extraType: extraType || null,
      wicket,
      wicketType: wicket ? wicketType : null,
      fielder: wicket && fielder ? fielder._id : null,
      commentary: commentary || ''
    };

    // Add ball to match
    match.addBall(ballData);

    // Update player in batting array
    let batsmanInnings = currentInnings.batting.find(
      b => b.player.toString() === batsman._id.toString()
    );

    if (!batsmanInnings) {
      batsmanInnings = {
        player: batsman._id,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        isBatting: true,
        order: currentInnings.batting.length + 1
      };
      currentInnings.batting.push(batsmanInnings);
    }

    // Update batsman stats
    batsmanInnings.runs += runs;
    batsmanInnings.balls += 1;
    if (runs === 4) batsmanInnings.fours += 1;
    if (runs === 6) batsmanInnings.sixes += 1;
    batsmanInnings.strikeRate = batsmanInnings.balls > 0
      ? ((batsmanInnings.runs / batsmanInnings.balls) * 100).toFixed(2)
      : 0;

    if (wicket) {
      batsmanInnings.isOut = true;
      batsmanInnings.outMethod = wicketType;
      batsmanInnings.fielder = fielder?._id;
      batsmanInnings.bowler = bowler._id;
      batsmanInnings.isBatting = false;
    }

    // Update bowler in bowling array
    let bowlerInnings = currentInnings.bowling.find(
      b => b.player.toString() === bowler._id.toString()
    );

    if (!bowlerInnings) {
      bowlerInnings = {
        player: bowler._id,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0
      };
      currentInnings.bowling.push(bowlerInnings);
    }

    // Update bowler stats
    const ballOvers = 1 / 6; // One ball as fraction of over
    bowlerInnings.overs += ballOvers;
    bowlerInnings.runs += runs + (extraType ? extras : 0);
    
    if (extraType === 'wide') bowlerInnings.wides += extras;
    if (extraType === 'no-ball') bowlerInnings.noBalls += extras;
    
    if (wicket) bowlerInnings.wickets += 1;
    
    // Calculate economy
    bowlerInnings.economy = bowlerInnings.overs > 0
      ? (bowlerInnings.runs / bowlerInnings.overs).toFixed(2)
      : 0;

    // Check if innings completed
    if (currentInnings.totalOvers >= match.overs || 
        currentInnings.totalWickets >= 10) {
      currentInnings.completed = true;
      
      // If this was first innings, start second innings
      if (match.currentInnings === 1) {
        const nextBattingTeam = match.team1.toString() === currentInnings.team.toString()
          ? match.team2
          : match.team1;
        
        match.innings.push({
          team: nextBattingTeam,
          batting: [],
          bowling: [],
          extras: {
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            penalty: 0
          },
          currentOver: [],
          completed: false
        });
        
        match.status = 'innings-break';
      } else {
        // Match completed
        match.status = 'completed';
        match.result = await calculateMatchResult(match);
      }
    }

    await match.save();

    // Update player career stats
    await updatePlayerStats(batsman._id, runs, 1, wicket);
    await updatePlayerStats(bowler._id, 0, 0, 0, 1/6, runs + (extraType ? extras : 0), wicket ? 1 : 0);

    res.json({
      message: 'Ball added successfully',
      match: await match.populate([
        { path: 'innings.batting.player', select: 'name playerId' },
        { path: 'innings.bowling.player', select: 'name playerId' },
        { path: 'innings.balls.batsman', select: 'name playerId' },
        { path: 'innings.balls.bowler', select: 'name playerId' }
      ])
    });

  } catch (error) {
    console.error('Add ball error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate match result
async function calculateMatchResult(match) {
  const innings1 = match.innings[0];
  const innings2 = match.innings[1];
  
  if (!innings1 || !innings2) return null;
  
  const result = {};
  
  if (innings1.totalRuns > innings2.totalRuns) {
    result.winner = innings1.team;
    result.winType = 'runs';
    result.margin = `${innings1.totalRuns - innings2.totalRuns} runs`;
  } else if (innings2.totalRuns > innings1.totalRuns) {
    result.winner = innings2.team;
    result.winType = 'wickets';
    const wicketsLeft = 10 - innings2.totalWickets;
    result.margin = `${wicketsLeft} wickets`;
  } else {
    result.winner = null;
    result.winType = 'tie';
    result.margin = 'Match tied';
  }
  
  // Find player of the match (simplified logic)
  const allPlayers = [];
  innings1.batting.forEach(b => allPlayers.push({ player: b.player, score: b.runs }));
  innings2.batting.forEach(b => allPlayers.push({ player: b.player, score: b.runs }));
  
  if (allPlayers.length > 0) {
    const topScorer = allPlayers.reduce((max, player) => 
      player.score > max.score ? player : max
    );
    result.playerOfMatch = topScorer.player;
  }
  
  return result;
}

// Helper function to update player stats
async function updatePlayerStats(playerId, runs, balls, isOut, overs = 0, runsConceded = 0, wickets = 0) {
  const player = await Player.findById(playerId);
  if (!player) return;
  
  if (runs > 0 || balls > 0) {
    player.updateBattingStats(runs, balls, !isOut);
  }
  
  if (overs > 0) {
    player.updateBowlingStats(overs, runsConceded, wickets, 0);
  }
  
  await player.save();
}

// Update match result (Admin only)
router.put('/:id/result', authMiddleware(['admin']), [
  body('winnerId').notEmpty().withMessage('Winner ID is required'),
  body('winType').isIn(['runs', 'wickets', 'super-over', 'draw', 'tie', 'no-result'])
    .withMessage('Invalid win type'),
  body('margin').notEmpty().withMessage('Margin is required'),
  body('playerOfMatchId').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const { winnerId, winType, margin, playerOfMatchId } = req.body;

    const winner = await Team.findOne({
      $or: [
        { _id: winnerId },
        { teamId: winnerId.toUpperCase() }
      ]
    });
    
    if (!winner) {
      return res.status(404).json({ message: 'Winner team not found' });
    }

    const playerOfMatch = playerOfMatchId 
      ? await Player.findById(playerOfMatchId)
      : null;

    match.result = {
      winner: winner._id,
      winType,
      margin,
      playerOfMatch: playerOfMatch?._id
    };

    match.status = 'completed';
    await match.save();

    // Update team stats
    await updateTeamStats(match, winner._id, winType);

    res.json({
      message: 'Match result updated successfully',
      match: await match.populate('result.winner result.playerOfMatch', 'name teamId playerId')
    });

  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update team stats
async function updateTeamStats(match, winnerId, winType) {
  const team1 = await Team.findById(match.team1);
  const team2 = await Team.findById(match.team2);
  
  if (!team1 || !team2) return;
  
  // Update matches played
  team1.matchesPlayed += 1;
  team2.matchesPlayed += 1;
  
  // Update wins/losses
  if (winType === 'no-result') {
    team1.matchesNoResult += 1;
    team2.matchesNoResult += 1;
    team1.points += 1;
    team2.points += 1;
  } else if (winType === 'draw' || winType === 'tie') {
    team1.matchesTied += 1;
    team2.matchesTied += 1;
    team1.points += 1;
    team2.points += 1;
  } else {
    if (team1._id.toString() === winnerId.toString()) {
      team1.matchesWon += 1;
      team2.matchesLost += 1;
      team1.points += 2;
    } else {
      team2.matchesWon += 1;
      team1.matchesLost += 1;
      team2.points += 2;
    }
  }
  
  await team1.save();
  await team2.save();
}

// Delete match (Admin only - soft delete)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Soft delete
    match.isActive = false;
    await match.save();

    res.json({
      message: 'Match deleted successfully'
    });

  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;