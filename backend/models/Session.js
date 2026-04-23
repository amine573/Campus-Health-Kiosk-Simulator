const mongoose = require('mongoose');

// Entity: Session — active access state of an authenticated user
const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionStatus: {
      type: String,
      enum: ['Active', 'Expired', 'Terminated'],
      default: 'Active',
    },
    startedAt: { type: Date, default: Date.now, required: true },
    endedAt: { type: Date, default: null },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

// Auto-expire sessions after 24 hours
SessionSchema.index({ startedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Session', SessionSchema);
