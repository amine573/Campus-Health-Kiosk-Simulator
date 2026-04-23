const mongoose = require('mongoose');

// Entity: InventoryItem — tracks stock level of each product
const InventoryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    quantityOnHand: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be below zero'],
      default: 0,
    },
    reorderThreshold: { type: Number, default: 5 },
    lastUpdatedAt: { type: Date, default: Date.now },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: false }
);

// Prevent going below zero at model level
InventoryItemSchema.methods.decrement = async function () {
  if (this.quantityOnHand <= 0) throw new Error('Insufficient inventory');
  this.quantityOnHand -= 1;
  this.lastUpdatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
