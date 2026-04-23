const AuditLogEntry = require('../models/AuditLogEntry');
const User = require('../models/User');
const { toCSV, flattenAuditEntry } = require('../utils/csvExport');

// GET /api/audit  — admin, with optional filters
exports.getLogs = async (req, res) => {
  try {
    const { eventType, actorId, outcome, startDate, endDate, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (actorId) filter.actor = actorId;
    if (outcome) filter.eventOutcome = outcome;
    if (startDate || endDate) {
      filter.eventTimestamp = {};
      if (startDate) filter.eventTimestamp.$gte = new Date(startDate);
      if (endDate) filter.eventTimestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLogEntry.find(filter)
        .populate('actor', 'name campusId role')
        .sort({ eventTimestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLogEntry.countDocuments(filter),
    ]);

    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/audit/summary  — usage summary for admin dashboard
exports.getSummary = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const [totalIssued, totalRedeemed, totalFailed, recentActivity] = await Promise.all([
      AuditLogEntry.countDocuments({ eventType: 'TokenIssued', eventOutcome: 'Success' }),
      AuditLogEntry.countDocuments({ eventType: 'TokenRedeemed', eventOutcome: 'Success' }),
      AuditLogEntry.countDocuments({ eventType: 'TokenRedeemed', eventOutcome: 'Failure' }),
      AuditLogEntry.find({ eventTimestamp: { $gte: since } })
        .populate('actor', 'name campusId')
        .sort({ eventTimestamp: -1 })
        .limit(10),
    ]);
    res.json({ success: true, summary: { totalIssued, totalRedeemed, totalFailed, recentActivity } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/audit/export/csv?userId=...  — CSV export for one or all students
exports.exportCSV = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};

    if (userId) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      filter.actor = userId;
    }

    const logs = await AuditLogEntry.find(filter)
      .populate('actor', 'name campusId role')
      .sort({ eventTimestamp: -1 })
      .limit(10000);

    const rows = logs.map(flattenAuditEntry);
    const csv = toCSV(rows);

    const filename = userId ? `audit_user_${userId}.csv` : `audit_all_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
