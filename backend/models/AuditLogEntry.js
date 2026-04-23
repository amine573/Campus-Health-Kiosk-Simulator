const mongoose = require('mongoose');

// Entity: AuditLogEntry — append-only audit trail for all critical system actions
const AuditLogEntrySchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'Authentication',
        'TokenIssued',
        'TokenRedeemed',
        'InventoryUpdated',
        'PolicyUpdated',
        'ProductCreated',
        'ProductDeleted',
        'UserCreated',
        'Logout',
      ],
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['Student', 'Staff', 'Administrator', 'System'],
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetObjectType: {
      type: String,
      enum: ['Token', 'Product', 'Policy', 'Session', 'InventoryItem', 'User'],
    },
    targetObjectId: { type: String, default: null },
    eventTimestamp: { type: Date, default: Date.now, required: true, index: true },
    eventOutcome: {
      type: String,
      enum: ['Success', 'Failure'],
      required: true,
    },
    details: { type: String, default: '' }, // human-readable detail
  },
  { timestamps: false }
);

// Prevent modification of audit entries
AuditLogEntrySchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit log entries are immutable');
});

module.exports = mongoose.model('AuditLogEntry', AuditLogEntrySchema);
