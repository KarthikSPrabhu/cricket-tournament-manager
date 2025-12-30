const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  photo: {
    type: String,
    default: ''
  },
  photoPublicId: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 50
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  playingRole: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'wicket-keeper-batsman'],
    required: true
  },
  battingStyle: {
    type: String,
    enum: ['right-hand', 'left-hand', null],
    default: null
  },
  bowlingStyle: {
    type: String,
    enum: ['right-arm fast', 'right-arm medium', 'right-arm spin', 
           'left-arm fast', 'left-arm medium', 'left-arm spin', null],
    default: null
  },
  isCaptain: {
    type: Boolean,
    default: false
  },
  isViceCaptain: {
    type: Boolean,
    default: false
  },
  // Batting Statistics
  battingStats: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    centuries: { type: Number, default: 0 },
    halfCenturies: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    notOuts: { type: Number, default: 0 }
  },
  // Bowling Statistics
  bowlingStats: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    bestBowling: { 
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 }
    },
    bowlingAverage: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    fourWickets: { type: Number, default: 0 },
    fiveWickets: { type: Number, default: 0 }
  },
  // Fielding Statistics
  fieldingStats: {
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 }
  },
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

// Indexes for faster queries
playerSchema.index({ playerId: 1 });
playerSchema.index({ team: 1, playingRole: 1 });
playerSchema.index({ 'battingStats.runs': -1 });
playerSchema.index({ 'bowlingStats.wickets': -1 });

// Virtual for full role description
playerSchema.virtual('fullRole').get(function() {
  let role = this.playingRole;
  if (this.battingStyle) {
    role += ` (${this.battingStyle})`;
  }
  if (this.bowlingStyle) {
    role += ` | ${this.bowlingStyle}`;
  }
  return role;
});

// Method to update batting stats
playerSchema.methods.updateBattingStats = function(runs, balls, isNotOut) {
  this.battingStats.matches += 1;
  this.battingStats.innings += 1;
  this.battingStats.runs += runs;
  this.battingStats.ballsFaced += balls;
  
  if (runs > this.battingStats.highestScore) {
    this.battingStats.highestScore = runs;
  }
  
  if (runs >= 100) this.battingStats.centuries += 1;
  else if (runs >= 50) this.battingStats.halfCenturies += 1;
  
  if (isNotOut) this.battingStats.notOuts += 1;
  
  // Calculate average
  const dismissals = this.battingStats.innings - this.battingStats.notOuts;
  this.battingStats.battingAverage = dismissals > 0 
    ? (this.battingStats.runs / dismissals).toFixed(2)
    : this.battingStats.runs;
    
  // Calculate strike rate
  this.battingStats.strikeRate = this.battingStats.ballsFaced > 0
    ? ((this.battingStats.runs / this.battingStats.ballsFaced) * 100).toFixed(2)
    : 0;
    
  return this;
};

// Method to update bowling stats
playerSchema.methods.updateBowlingStats = function(overs, runs, wickets, maidens) {
  this.bowlingStats.matches += 1;
  this.bowlingStats.innings += 1;
  this.bowlingStats.overs += overs;
  this.bowlingStats.balls += Math.floor(overs) * 6 + ((overs % 1) * 10);
  this.bowlingStats.maidens += maidens;
  this.bowlingStats.runsConceded += runs;
  this.bowlingStats.wickets += wickets;
  
  // Update best bowling
  if (wickets > this.bowlingStats.bestBowling.wickets || 
      (wickets === this.bowlingStats.bestBowling.wickets && runs < this.bowlingStats.bestBowling.runs)) {
    this.bowlingStats.bestBowling = { wickets, runs };
  }
  
  if (wickets >= 5) this.bowlingStats.fiveWickets += 1;
  else if (wickets >= 4) this.bowlingStats.fourWickets += 1;
  
  // Calculate bowling average
  this.bowlingStats.bowlingAverage = wickets > 0
    ? (this.bowlingStats.runsConceded / wickets).toFixed(2)
    : 0;
    
  // Calculate economy
  this.bowlingStats.economy = this.bowlingStats.overs > 0
    ? (this.bowlingStats.runsConceded / this.bowlingStats.overs).toFixed(2)
    : 0;
    
  // Calculate strike rate
  this.bowlingStats.strikeRate = wickets > 0
    ? (this.bowlingStats.balls / wickets).toFixed(2)
    : 0;
    
  return this;
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;