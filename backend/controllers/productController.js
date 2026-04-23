const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const AuditLogEntry = require('../models/AuditLogEntry');

const audit = async (data) => { try { await AuditLogEntry.create(data); } catch (_) {} };

// GET /api/products  — authenticated users
exports.getProducts = async (req, res) => {
  try {
    const filter = req.user.role === 'Administrator' ? {} : { availabilityStatus: { $ne: 'Disabled' } };
    const products = await Product.find(filter).sort({ category: 1, name: 1 });

    // Attach inventory data
    const inventories = await InventoryItem.find({ product: { $in: products.map((p) => p._id) } });
    const invMap = Object.fromEntries(inventories.map((i) => [i.product.toString(), i]));

    const result = products.map((p) => ({
      ...p.toObject(),
      inventory: invMap[p._id.toString()] || { quantityOnHand: 0 },
    }));

    res.json({ success: true, products: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products  — admin only
exports.createProduct = async (req, res) => {
  try {
    const { name, category, description, availabilityStatus, initialQuantity } = req.body;
    const product = await Product.create({ name, category, description, availabilityStatus });

    await InventoryItem.create({
      product: product._id,
      quantityOnHand: initialQuantity || 0,
      lastUpdatedBy: req.user._id,
    });

    await audit({ eventType: 'ProductCreated', actorRole: req.user.role, actor: req.user._id, targetObjectType: 'Product', targetObjectId: product._id.toString(), eventOutcome: 'Success', details: `Created product: ${name}` });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/products/:id  — admin only
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await audit({ eventType: 'InventoryUpdated', actorRole: req.user.role, actor: req.user._id, targetObjectType: 'Product', targetObjectId: product._id.toString(), eventOutcome: 'Success', details: `Updated product: ${product.name}` });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id  — admin only (soft delete — sets Disabled)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { availabilityStatus: 'Disabled' }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await audit({ eventType: 'ProductDeleted', actorRole: req.user.role, actor: req.user._id, targetObjectType: 'Product', targetObjectId: product._id.toString(), eventOutcome: 'Success', details: `Disabled product: ${product.name}` });

    res.json({ success: true, message: 'Product disabled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/products/:id/restore  — undo delete
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { availabilityStatus: 'Available' }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await audit({ eventType: 'ProductCreated', actorRole: req.user.role, actor: req.user._id, targetObjectType: 'Product', targetObjectId: product._id.toString(), eventOutcome: 'Success', details: `Restored product: ${product.name}` });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
