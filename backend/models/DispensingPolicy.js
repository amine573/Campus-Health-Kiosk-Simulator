const mongoose = require('mongoose');

// Entity: DispensingPolicy — campus governance constraints on dispensing
const DispensingPolicySchema = new mongoose.Schema(
  {
    policyScope: {
      type: String,
      enum: ['Per-user', 'Per-item', 'Both'],
      required: true,
      default: 'Both',
    },
    timeWindow: {
      type: String,
      enum: ['day', 'week', 'month'],
      default: 'week',
    },
    maxPerUser: {
      type: Number,
      required: true,
      min: [0, 'Max per user must be >= 0'],
      default: 3,
    },
    maxPerItem: {
      type: Number,
      required: true,
      min: [0, 'Max per item must be >= 0'],
      default: 1,
    },
    policyStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: false }
);

module.exports = mongoose.model('DispensingPolicy', DispensingPolicySchema);
