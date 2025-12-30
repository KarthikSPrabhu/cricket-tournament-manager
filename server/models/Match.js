const mongoose = require('mongoose');

const ballSchema = new mongoose.Schema({
  ballNumber: Number,
  overNumber: Number,
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  batsman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  nonStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  runs: {
    type: Number,
    default: 0
  },
  extras: {
    type: Number,
    default: 0
  },
  extraType: {
    type: String,
    enum: ['wide', 'no-ball', 'bye', 'leg-bye', 'penalty', null],
    default: null
  },
  wicket: {
    type: Boolean,
    default: false
  },
  wicketType: {
    type: String,
    enum: ['bowled', 'caught', 'lbw', 'run-out', 'stumped', 'hit-wicket', 'retired', null],
    default: null
  },
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  commentary: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const inningsSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  batting: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    isOut: { type: Boolean, default: false },
    outMethod: String,
    fielder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    isBatting: { type: Boolean, default: false },
    order: Number
  }],
  bowling: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    overs: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    economy: { type: Number, default: 0 }
  }],
  totalRuns: {
    type: Number,
    default: 0
  },
  totalWickets: {
    type: Number,
    default: 0
  },
  totalOvers: {
    type: Number,
    default: 0
  },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 }
  },
  balls: [ballSchema],
  currentOver: [ballSchema],
  powerplayOvers: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  matchNumber: {
    type: Number,
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  toss: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    decision: {
      type: String,
      enum: ['bat', 'bowl', null],
      default: null
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'toss', 'live', 'innings-break', 'completed', 'abandoned', 'cancelled'],
    default: 'scheduled'
  },
  matchType: {
    type: String,
    enum: ['group', 'quarter-final', 'semi-final', 'final'],
    default: 'group'
  },
  overs: {
    type: Number,
    default: 20
  },
  currentInnings: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  innings: [inningsSchema],
  result: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    winType: {
      type: String,
      enum: ['runs', 'wickets', 'super-over', 'draw', 'tie', 'no-result', null],
      default: null
    },
    margin: String,
    playerOfMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  umpires: {
    onField: [String],
    thirdUmpire: String,
    matchReferee: String
  },
  streamLink: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ date: 1, startTime: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ team1: 1, team2: 1 });
matchSchema.index({ matchId: 1 });

// Virtual for match status text
matchSchema.virtual('statusText').get(function() {
  const statusMap = {
    'scheduled': 'Scheduled',
    'toss': 'Toss Time',
    'live': 'Live',
    'innings-break': 'Innings Break',
    'completed': 'Completed',
    'abandoned': 'Abandoned',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Method to get current score
matchSchema.methods.getCurrentScore = function() {
  if (!this.innings || this.innings.length === 0) {
    return null;
  }
  
  const currentInnings = this.innings[this.currentInnings - 1];
  if (!currentInnings) {
    return null;
  }
  
  return {
    runs: currentInnings.totalRuns,
    wickets: currentInnings.totalWickets,
    overs: currentInnings.totalOvers,
    currentOver: currentInnings.currentOver
  };
};

// Method to add ball to innings
matchSchema.methods.addBall = function(ballData) {
  const currentInnings = this.innings[this.currentInnings - 1];
  if (!currentInnings) {
    throw new Error('No innings found');
  }
  
  // Add to current over
  currentInnings.currentOver.push(ballData);
  
  // If over is complete (6 balls), move to balls array
  if (currentInnings.currentOver.length >= 6) {
    currentInnings.balls.push(...currentInnings.currentOver);
    currentInnings.currentOver = [];
    currentInnings.totalOvers += 1;
  }
  
  // Update runs
  currentInnings.totalRuns += ballData.runs + (ballData.extras || 0);
  
  // Update extras
  if (ballData.extraType) {
    switch (ballData.extraType) {
      case 'wide':
        currentInnings.extras.wides += ballData.extras;
        break;
      case 'no-ball':
        currentInnings.extras.noBalls += ballData.extras;
        break;
      case 'bye':
        currentInnings.extras.byes += ballData.extras;
        break;
      case 'leg-bye':
        currentInnings.extras.legByes += ballData.extras;
        break;
      case 'penalty':
        currentInnings.extras.penalty += ballData.extras;
        break;
    }
  }
  
  // Update wicket
  if (ballData.wicket) {
    currentInnings.totalWickets += 1;
  }
  
  return this;
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;