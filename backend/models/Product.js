const mongoose = require('mongoose');

// Entity: Product — catalog of eligible non-medicine health products
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['First Aid', 'Hygiene', 'Wellness', 'Vitamins', 'Other'],
      required: true,
    },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    eligibilityTag: {
      type: String,
      default: 'non-medicine',
      enum: ['non-medicine'],
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'Unavailable', 'Disabled'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
