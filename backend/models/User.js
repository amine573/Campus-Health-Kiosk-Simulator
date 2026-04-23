const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Entity: User — foundational identity reference
const UserSchema = new mongoose.Schema(
  {
    campusId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String, select: false }, // null for SSO-only users
    role: {
      type: String,
      enum: ['Student', 'Staff', 'Administrator'],
      default: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Disabled'],
      default: 'Active',
    },
    ssoProvider: {
      type: String,
      enum: ['local', 'microsoft'],
      default: 'local',
    },
    microsoftId: { type: String, sparse: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toPublicJSON = function () {
  return {
    userId: this._id,
    campusId: this.campusId,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
