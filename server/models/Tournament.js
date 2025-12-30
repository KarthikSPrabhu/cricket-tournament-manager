const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  format: {
    type: String,
    enum: ['knockout', 'league', 'group+knockout'],
    default: 'group+knockout'
  },
  groups: [{
    name: {
      type: String,
      required: true
    },
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }]
  }],
  rules: {
    pointsPerWin: {
      type: Number,
      default: 2
    },
    pointsPerTie: {
      type: Number,
      default: 1
    },
    pointsPerNoResult: {
      type: Number,
      default: 1
    },
    superOver: {
      type: Boolean,
      default: true
    },
    dlsMethod: {
      type: Boolean,
      default: true
    },
    powerplayOvers: {
      type: Number,
      default: 6
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
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

// Indexes
tournamentSchema.index({ year: -1, status: 1 });
tournamentSchema.index({ startDate: 1, endDate: 1 });

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;