const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: {
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
  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 3
  },
  logo: {
    type: String,
    default: ''
  },
  logoPublicId: {
    type: String,
    default: ''
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  viceCaptain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  coach: {
    type: String,
    trim: true
  },
  group: {
    type: String,
    enum: ['A', 'B', 'C', 'D', null],
    default: null
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  matchesPlayed: {
    type: Number,
    default: 0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  matchesLost: {
    type: Number,
    default: 0
  },
  matchesTied: {
    type: Number,
    default: 0
  },
  matchesNoResult: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  netRunRate: {
    type: Number,
    default: 0.0
  },
  totalRunsScored: {
    type: Number,
    default: 0
  },
  totalOversFaced: {
    type: Number,
    default: 0
  },
  totalRunsConceded: {
    type: Number,
    default: 0
  },
  totalOversBowled: {
    type: Number,
    default: 0
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

// Index for faster queries
teamSchema.index({ teamId: 1, group: 1, points: -1, netRunRate: -1 });

// Virtual for win percentage
teamSchema.virtual('winPercentage').get(function() {
  if (this.matchesPlayed === 0) return 0;
  return ((this.matchesWon / this.matchesPlayed) * 100).toFixed(2);
});

// Method to update team stats
teamSchema.methods.updateStats = function(matchResult) {
  // This will be implemented after match completion
  return this;
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;