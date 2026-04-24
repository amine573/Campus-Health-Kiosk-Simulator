const QRCode = require('qrcode');
const Token = require('../models/Token');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const DispensingPolicy = require('../models/DispensingPolicy');
const RedemptionEvent = require('../models/RedemptionEvent');
const AuditLogEntry = require('../models/AuditLogEntry');
const { sendDispensingConfirmation } = require('../utils/emailService');

// Fallback only — real value comes from the active policy in DB
const DEFAULT_TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '30');

const auditLog = async (data) => {
  try { await AuditLogEntry.create(data); } catch (_) {}
};

// ── Sweep: bulk-mark all past-due Issued tokens as Expired in the DB ──────────
exports.sweepExpiredTokens = async () => {
  try {
    const result = await Token.updateMany(
      { tokenStatus: 'Issued', expiresAt: { $lt: new Date() } },
      { $set: { tokenStatus: 'Expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`🧹 Swept ${result.modifiedCount} expired token(s) to Expired status`);
    }
  } catch (err) {
    console.error('Token sweep error:', err.message);
  }
};

// GET /api/tokens/my
exports.getMyTokens = async (req, res) => {
  try {
    // Mark any overdue tokens for this user as Expired before returning
    await Token.updateMany(
      { user: req.user._id, tokenStatus: 'Issued', expiresAt: { $lt: new Date() } },
      { $set: { tokenStatus: 'Expired' } }
    );

    const tokens = await Token.find({ user: req.user._id })
      .populate('product', 'name category imageUrl')
      .sort({ issuedAt: -1 })
      .limit(20);

    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tokens/request
exports.requestToken = async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId required' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || product.availabilityStatus !== 'Available') {
      return res.status(400).json({ success: false, message: 'Product not available' });
    }

    const inventory = await InventoryItem.findOne({ product: productId });
    if (!inventory || inventory.quantityOnHand <= 0) {
      return res.status(400).json({ success: false, message: 'Out of stock' });
    }

    const policy = await DispensingPolicy.findOne({ policyStatus: 'Active' });
    const tokenExpiryMinutes = policy?.tokenExpiryMinutes ?? DEFAULT_TOKEN_EXPIRY_MINUTES;

    if (policy) {
      const windowMs = policy.timeWindow === 'day' ? 86400000
        : policy.timeWindow === 'week' ? 604800000 : 2592000000;
      const since = new Date(Date.now() - windowMs);

      const userTokenCount = await Token.countDocuments({
        user: req.user._id,
        issuedAt: { $gte: since },
        tokenStatus: { $in: ['Issued', 'Redeemed'] },
      });
      if (userTokenCount >= policy.maxPerUser) {
        return res.status(429).json({
          success: false,
          message: `Limit reached (max ${policy.maxPerUser} items per ${policy.timeWindow})`,
          reason: 'Limit-exceeded',
        });
      }

      const itemTokenCount = await Token.countDocuments({
        user: req.user._id,
        product: productId,
        issuedAt: { $gte: since },
        tokenStatus: { $in: ['Issued', 'Redeemed'] },
      });
      if (itemTokenCount >= policy.maxPerItem) {
        return res.status(429).json({
          success: false,
          message: `Item limit reached (max ${policy.maxPerItem} of this product per ${policy.timeWindow})`,
          reason: 'Limit-exceeded',
        });
      }
    }

    const expiresAt = new Date(Date.now() + tokenExpiryMinutes * 60 * 1000);
    const token = await Token.create({ user: req.user._id, product: productId, expiresAt });

    const qrDataUrl = await QRCode.toDataURL(token.tokenId, { width: 256, margin: 1 });
    token.qrCodeDataUrl = qrDataUrl;
    await token.save();

    await auditLog({
      eventType: 'TokenIssued',
      actorRole: req.user.role,
      actor: req.user._id,
      targetObjectType: 'Token',
      targetObjectId: token._id.toString(),
      eventOutcome: 'Success',
      details: `Token issued for product ${product.name}, expires in ${tokenExpiryMinutes}min`,
    });

    await token.populate('product', 'name category imageUrl');

    res.status(201).json({
      success: true,
      token: {
        tokenId: token.tokenId,
        _id: token._id,
        product: token.product,
        issuedAt: token.issuedAt,
        expiresAt: token.expiresAt,
        tokenStatus: token.tokenStatus,
        qrCodeDataUrl: token.qrCodeDataUrl,
        expiresInMinutes: tokenExpiryMinutes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tokens/redeem
exports.redeemToken = async (req, res) => {
  const { tokenId } = req.body;
  if (!tokenId) {
    return res.status(400).json({ success: false, message: 'tokenId required' });
  }

  try {
    const token = await Token.findOne({ tokenId }).populate('user product');
    if (!token) {
      // Log failed attempt for unknown token
      await auditLog({
        eventType: 'TokenRedeemed',
        actorRole: 'System',
        actor: null,
        targetObjectType: 'Token',
        targetObjectId: null,
        eventOutcome: 'Failure',
        details: `Redemption failed — token not found: ${tokenId}`,
      });
      return res.status(404).json({ success: false, message: 'Token not found', reason: 'Invalid' });
    }

    if (token.tokenStatus === 'Redeemed') {
      await RedemptionEvent.create({
        token: token._id, user: token.user._id, product: token.product._id,
        result: 'Rejected', rejectionReason: 'Reused', occurredAt: new Date(),
      });
      // ✅ Audit failure so Failed Attempts counter increments
      await auditLog({
        eventType: 'TokenRedeemed',
        actorRole: token.user.role,
        actor: token.user._id,
        targetObjectType: 'Token',
        targetObjectId: token._id.toString(),
        eventOutcome: 'Failure',
        details: `Redemption failed — token already redeemed: ${token.product.name}`,
      });
      return res.status(400).json({ success: false, message: 'Token already redeemed', reason: 'Reused' });
    }

    if (token.tokenStatus === 'Expired' || token.isExpired()) {
      if (token.tokenStatus !== 'Expired') {
        token.tokenStatus = 'Expired';
        await token.save();
      }
      await RedemptionEvent.create({
        token: token._id, user: token.user._id, product: token.product._id,
        result: 'Rejected', rejectionReason: 'Expired', occurredAt: new Date(),
      });
      // ✅ Audit failure so Failed Attempts counter increments
      await auditLog({
        eventType: 'TokenRedeemed',
        actorRole: token.user.role,
        actor: token.user._id,
        targetObjectType: 'Token',
        targetObjectId: token._id.toString(),
        eventOutcome: 'Failure',
        details: `Redemption failed — token expired: ${token.product.name}`,
      });
      return res.status(400).json({ success: false, message: 'Token has expired', reason: 'Expired' });
    }

    if (token.tokenStatus !== 'Issued') {
      await auditLog({
        eventType: 'TokenRedeemed',
        actorRole: token.user.role,
        actor: token.user._id,
        targetObjectType: 'Token',
        targetObjectId: token._id.toString(),
        eventOutcome: 'Failure',
        details: `Redemption failed — invalid token status: ${token.tokenStatus}`,
      });
      return res.status(400).json({ success: false, message: 'Token is not valid', reason: 'Invalid' });
    }

    const inventory = await InventoryItem.findOne({ product: token.product._id });
    if (!inventory || inventory.quantityOnHand <= 0) {
      await RedemptionEvent.create({
        token: token._id, user: token.user._id, product: token.product._id,
        result: 'Rejected', rejectionReason: 'Out-of-stock', occurredAt: new Date(),
      });
      // ✅ Audit failure so Failed Attempts counter increments
      await auditLog({
        eventType: 'TokenRedeemed',
        actorRole: token.user.role,
        actor: token.user._id,
        targetObjectType: 'Token',
        targetObjectId: token._id.toString(),
        eventOutcome: 'Failure',
        details: `Redemption failed — out of stock: ${token.product.name}`,
      });
      return res.status(400).json({ success: false, message: 'Product is out of stock', reason: 'Out-of-stock' });
    }

    // Success path
    token.tokenStatus = 'Redeemed';
    token.redeemedAt = new Date();
    await token.save();
    await inventory.decrement();

    const redemptionEvent = await RedemptionEvent.create({
      token: token._id,
      user: token.user._id,
      product: token.product._id,
      result: 'Success',
      rejectionReason: null,
      occurredAt: new Date(),
    });

    await auditLog({
      eventType: 'TokenRedeemed',
      actorRole: token.user.role,
      actor: token.user._id,
      targetObjectType: 'Token',
      targetObjectId: token._id.toString(),
      eventOutcome: 'Success',
      details: `Redeemed: ${token.product.name}`,
    });

    const emailSent = await sendDispensingConfirmation({
      userEmail: token.user.email,
      userName: token.user.name,
      productName: token.product.name,
      redeemedAt: token.redeemedAt,
    });

    if (emailSent) {
      await RedemptionEvent.findByIdAndUpdate(redemptionEvent._id, { emailSent: true });
    }

    res.json({
      success: true,
      message: 'Dispensing successful — please collect your item',
      productName: token.product.name,
      userName: token.user.name,
      redeemedAt: token.redeemedAt,
      emailSent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};