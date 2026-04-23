const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLogEntry = require('../models/AuditLogEntry');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

const logAuth = async ({ eventType, actor, outcome, details, req }) => {
  try {
    await AuditLogEntry.create({
      eventType,
      actorRole: actor?.role || 'System',
      actor: actor?._id || null,
      targetObjectType: 'Session',
      targetObjectId: null,
      eventOutcome: outcome,
      details,
    });
  } catch (_) {}
};

// POST /api/auth/login  (local credentials — admin/staff only)
exports.login = async (req, res) => {
  const { campusId, password } = req.body;

  if (!campusId || !password) {
    return res.status(400).json({ success: false, message: 'Campus ID and password required' });
  }

  try {
    const user = await User.findOne({ campusId }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      await logAuth({ eventType: 'Authentication', outcome: 'Failure', details: `Failed login for campusId: ${campusId}` });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const session = await Session.create({ user: user._id });
    const token = signToken(user._id);

    await logAuth({ eventType: 'Authentication', actor: user, outcome: 'Success', details: 'Local login' });

    res.json({
      success: true,
      token,
      sessionId: session._id,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/microsoft  (simulated Microsoft SSO for students)
exports.microsoftSSO = async (req, res) => {
  const { microsoftId, email, name, campusId } = req.body;

  if (!microsoftId || !email) {
    return res.status(400).json({ success: false, message: 'Microsoft identity data required' });
  }

  try {
    let user = await User.findOne({ $or: [{ microsoftId }, { email: email.toLowerCase() }] });

    if (!user) {
      // Auto-provision campus user from SSO
      user = await User.create({
        campusId: campusId || email.split('@')[0].toUpperCase(),
        email: email.toLowerCase(),
        name,
        role: 'Student',
        ssoProvider: 'microsoft',
        microsoftId,
        status: 'Active',
      });
      await logAuth({ eventType: 'UserCreated', actor: user, outcome: 'Success', details: `SSO provisioned: ${email}` });
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }

    user.lastLoginAt = new Date();
    user.microsoftId = microsoftId;
    await user.save({ validateBeforeSave: false });

    const session = await Session.create({ user: user._id });
    const token = signToken(user._id);

    await logAuth({ eventType: 'Authentication', actor: user, outcome: 'Success', details: 'Microsoft SSO login' });

    res.json({
      success: true,
      token,
      sessionId: session._id,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await Session.findOneAndUpdate(
      { user: req.user._id, sessionStatus: 'Active' },
      { sessionStatus: 'Terminated', endedAt: new Date() }
    );
    await logAuth({ eventType: 'Logout', actor: req.user, outcome: 'Success', details: 'User logged out' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

// POST /api/auth/register  (admin only — create staff/admin accounts)
exports.register = async (req, res) => {
  const { campusId, email, name, password, role } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ campusId }, { email }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ campusId, email, name, password, role: role || 'Student', ssoProvider: 'local' });
    await logAuth({ eventType: 'UserCreated', actor: req.user, outcome: 'Success', details: `Created user ${campusId}` });

    res.status(201).json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
