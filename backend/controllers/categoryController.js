const Category = require('../models/Category');
const Product = require('../models/Product');
const AuditLogEntry = require('../models/AuditLogEntry');

const audit = async (data) => { try { await AuditLogEntry.create(data); } catch (_) {} };

// GET /api/categories  — all active categories (authenticated)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/categories/all  — all categories including inactive (admin only)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/categories  — admin only
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }
    const category = await Category.create({ name: name.trim(), description, createdBy: req.user._id });

    await audit({
      eventType: 'PolicyUpdated',
      actorRole: req.user.role,
      actor: req.user._id,
      targetObjectType: 'Category',
      targetObjectId: category._id.toString(),
      eventOutcome: 'Success',
      details: `Category created: ${name}`,
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/categories/:id  — admin only
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim() });
      if (existing) return res.status(409).json({ success: false, message: 'Category name already in use' });
      category.name = name.trim();
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await audit({
      eventType: 'PolicyUpdated',
      actorRole: req.user.role,
      actor: req.user._id,
      targetObjectType: 'Category',
      targetObjectId: category._id.toString(),
      eventOutcome: 'Success',
      details: `Category updated: ${category.name}`,
    });

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/categories/:id  — admin only (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Check if any active products use this category
    const productCount = await Product.countDocuments({
      category: category.name,
      availabilityStatus: { $ne: 'Disabled' },
    });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${productCount} active product(s) use this category`,
      });
    }

    category.isActive = false;
    await category.save();

    await audit({
      eventType: 'PolicyUpdated',
      actorRole: req.user.role,
      actor: req.user._id,
      targetObjectType: 'Category',
      targetObjectId: category._id.toString(),
      eventOutcome: 'Success',
      details: `Category deactivated: ${category.name}`,
    });

    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};