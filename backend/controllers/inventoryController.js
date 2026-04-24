const InventoryItem = require('../models/InventoryItem');
const DispensingPolicy = require('../models/DispensingPolicy');
const AuditLogEntry = require('../models/AuditLogEntry');

const audit = async (data) => { try { await AuditLogEntry.create(data); } catch (_) {} };

// GET /api/inventory  — admin
exports.getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().populate('product', 'name category availabilityStatus').sort({ 'product.name': 1 });
    res.json({ success: true, inventory: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/inventory/:productId  — admin
exports.updateInventory = async (req, res) => {
  const { quantityOnHand, reorderThreshold } = req.body;
  try {
    if (quantityOnHand !== undefined && quantityOnHand < 0) {
      return res.status(400).json({ success: false, message: 'Quantity cannot be below zero (FR-28)' });
    }

    const item = await InventoryItem.findOneAndUpdate(
      { product: req.params.productId },
      { quantityOnHand, reorderThreshold, lastUpdatedAt: new Date(), lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('product', 'name category');

    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    await audit({ eventType: 'InventoryUpdated', actorRole: req.user.role, actor: req.user._id, targetObjectType: 'InventoryItem', targetObjectId: item._id.toString(), eventOutcome: 'Success', details: `Updated inventory for ${item.product.name}: qty=${quantityOnHand}` });

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inventory/policy  — get active dispensing policy
exports.getPolicy = async (req, res) => {
  try {
    const policy = await DispensingPolicy.findOne({ policyStatus: 'Active' });
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/policy  — admin update policy
exports.updatePolicy = async (req, res) => {
  try {
    const { policyScope, timeWindow, maxPerUser, maxPerItem, tokenExpiryMinutes } = req.body;
    let policy = await DispensingPolicy.findOne({ policyStatus: 'Active' });

    if (policy) {
      policy.policyScope        = policyScope        || policy.policyScope;
      policy.timeWindow         = timeWindow         || policy.timeWindow;
      policy.maxPerUser         = maxPerUser         ?? policy.maxPerUser;
      policy.maxPerItem         = maxPerItem         ?? policy.maxPerItem;
      policy.tokenExpiryMinutes = tokenExpiryMinutes ?? policy.tokenExpiryMinutes;
      policy.updatedAt          = new Date();
      policy.updatedBy          = req.user._id;
      await policy.save();
    } else {
      policy = await DispensingPolicy.create({
        policyScope,
        timeWindow,
        maxPerUser,
        maxPerItem,
        tokenExpiryMinutes,
        updatedBy: req.user._id,
      });
    }

    await audit({
      eventType: 'PolicyUpdated',
      actorRole: req.user.role,
      actor: req.user._id,
      targetObjectType: 'Policy',
      targetObjectId: policy._id.toString(),
      eventOutcome: 'Success',
      details: `Policy updated: max ${maxPerUser}/user per ${timeWindow}, token expiry: ${tokenExpiryMinutes}min`,
    });

    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};