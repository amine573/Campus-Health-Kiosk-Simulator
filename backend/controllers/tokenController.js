const QRCode = require('qrcode');
const Token = require('../models/Token');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const DispensingPolicy = require('../models/DispensingPolicy');
const RedemptionEvent = require('../models/RedemptionEvent');
const AuditLogEntry = require('../models/AuditLogEntry');
const { sendDispensingConfirmation } = require('../utils/emailService');

const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '30');

const auditLog = async (data) => {
  try { await AuditLogEntry.create(data); } catch (_) {}
};

// GET /api/tokens/my  — list current user's tokens
exports.getMyTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ user: req.user._id })
      .populate('product', 'name category imageUrl')
      .sort({ issuedAt: -1 })
      .limit(20);
    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tokens/request  — FR-11 to FR-16
exports.requestToken = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId required' });
  }

  try {
    // FR-12: verify product availability
    const product = await Product.findById(productId);
    if (!product || product.availabilityStatus !== 'Available') {
      return res.status(400).json({ success: false, message: 'Product not available' });
    }

    // Inventory check
    const inventory = await InventoryItem.findOne({ product: productId });
    if (!inventory || inventory.quantityOnHand <= 0) {
      return res.status(400).json({ success: false, message: 'Out of stock' });
    }

    // FR-09/FR-10: policy enforcement
    const policy = await DispensingPolicy.findOne({ policyStatus: 'Active' });
    if (policy) {
      const windowMs = policy.timeWindow === 'day' ? 86400000
        : policy.timeWindow === 'week' ? 604800000 : 2592000000;
      const since = new Date(Date.now() - windowMs);

      // Per-user limit
      const userTokenCount = await Token.countDocuments({
        user: req.user._id,
        issuedAt: { $gte: since },
        tokenStatus: { $in: ['Issued', 'Redeemed'] },
      });
      if (userTokenCount >= policy.maxPerUser) {
        return res.status(429).json({
          success: false,
          message: `Weekly limit reached (max ${policy.maxPerUser} items per ${policy.timeWindow})`,
          reason: 'Limit-exceeded',
        });
      }

      // Per-item limit
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

    // FR-13/FR-14: generate token with expiry
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
    const token = await Token.create({
      user: req.user._id,
      product: productId,
      expiresAt,
    });

    // FR-15: generate QR code encoding only tokenId (NFR-05: no PII in QR)
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
      details: `Token issued for product ${product.name}`,
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
        expiresInMinutes: TOKEN_EXPIRY_MINUTES,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tokens/redeem  — FR-17 to FR-24 (kiosk endpoint)
exports.redeemToken = async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ success: false, message: 'tokenId required' });
  }

  try {
    // FR-18: validate token
    const token = await Token.findOne({ tokenId }).populate('user product');
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found', reason: 'Invalid' });
    }

    if (token.tokenStatus === 'Redeemed') {
      await RedemptionEvent.create({ token: token._id, user: token.user._id, product: token.product._id, result: 'Rejected', rejectionReason: 'Reused', occurredAt: new Date() });
      return res.status(400).json({ success: false, message: 'Token already redeemed', reason: 'Reused' });
    }

    if (token.tokenStatus === 'Expired' || token.isExpired()) {
      token.tokenStatus = 'Expired';
      await token.save();
      await RedemptionEvent.create({ token: token._id, user: token.user._id, product: token.product._id, result: 'Rejected', rejectionReason: 'Expired', occurredAt: new Date() });
      return res.status(400).json({ success: false, message: 'Token has expired', reason: 'Expired' });
    }

    if (token.tokenStatus !== 'Issued') {
      return res.status(400).json({ success: false, message: 'Token is not valid', reason: 'Invalid' });
    }

    // FR-20: verify inventory at redemption time
    const inventory = await InventoryItem.findOne({ product: token.product._id });
    if (!inventory || inventory.quantityOnHand <= 0) {
      await RedemptionEvent.create({ token: token._id, user: token.user._id, product: token.product._id, result: 'Rejected', rejectionReason: 'Out-of-stock', occurredAt: new Date() });
      return res.status(400).json({ success: false, message: 'Product is out of stock', reason: 'Out-of-stock' });
    }

    // FR-21/FR-22: atomic-style update — mark redeemed + decrement inventory
    token.tokenStatus = 'Redeemed';
    token.redeemedAt = new Date();
    await token.save();

    await inventory.decrement();

    // FR-24: record redemption event
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

    // Email verification after dispensing
    const emailSent = await sendDispensingConfirmation({
      userEmail: token.user.email,
      userName: token.user.name,
      productName: token.product.name,
      redeemedAt: token.redeemedAt,
    });

    if (emailSent) {
      await RedemptionEvent.findByIdAndUpdate(redemptionEvent._id, { emailSent: true });
    }

    // FR-23: simulate dispensing
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
