const mongoose = require('mongoose');

// Entity: RedemptionEvent — records every redemption attempt at the kiosk
const RedemptionEventSchema = new mongoose.Schema(
  {
    token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    result: {
      type: String,
      enum: ['Success', 'Rejected'],
      required: true,
    },
    rejectionReason: {
      type: String,
      enum: ['Invalid', 'Expired', 'Reused', 'Out-of-stock', 'Limit-exceeded', null],
      default: null,
    },
    occurredAt: { type: Date, default: Date.now, required: true },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: false }
);

module.exports = mongoose.model('RedemptionEvent', RedemptionEventSchema);
