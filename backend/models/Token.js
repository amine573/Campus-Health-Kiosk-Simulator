const mongoose = require('mongoose');


// Entity: Token — short-lived, single-use authorization artifact
const TokenSchema = new mongoose.Schema(
  {
    tokenId: {
  type: String,
  default: () => require('crypto').randomUUID(),
  unique: true,
  index: true,
},
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    issuedAt: { type: Date, default: Date.now, required: true },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB auto-deletes expired token documents after expiry + 1h grace
    },
    tokenStatus: {
      type: String,
      enum: ['Issued', 'Redeemed', 'Expired', 'Invalidated'],
      default: 'Issued',
    },
    redeemedAt: { type: Date, default: null },
    qrCodeDataUrl: { type: String }, // base64 QR code image
  },
  { timestamps: false }
);

// TTL index — auto-expire documents 1 hour after expiresAt
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

TokenSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

TokenSchema.methods.isValid = function () {
  return this.tokenStatus === 'Issued' && !this.isExpired();
};

module.exports = mongoose.model('Token', TokenSchema);
