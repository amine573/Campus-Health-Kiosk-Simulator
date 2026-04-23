require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const DispensingPolicy = require('../models/DispensingPolicy');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Admin user
  const adminExists = await User.findOne({ campusId: 'ADMIN001' });
  if (!adminExists) {
    await User.create({
      campusId: 'ADMIN001',
      email: 'admin@aui.ma',
      name: 'System Administrator',
      password: 'Admin@12345',
      role: 'Administrator',
      ssoProvider: 'local',
      status: 'Active',
    });
    console.log('✅ Admin user created — campusId: ADMIN001 / password: Admin@12345');
  }

  // Products
  const products = [
    { name: 'Bandage Rolls (5-pack)', category: 'First Aid', description: 'Standard adhesive bandages for minor cuts and scrapes.' },
    { name: 'Antiseptic Wipes', category: 'First Aid', description: 'Single-use alcohol wipes for wound cleaning.' },
    { name: 'Disposable Face Masks (3-pack)', category: 'Hygiene', description: 'Surgical-grade disposable face masks.' },
    { name: 'Hand Sanitizer (50ml)', category: 'Hygiene', description: '70% alcohol hand sanitizer gel.' },
    { name: 'Feminine Hygiene Pads', category: 'Hygiene', description: 'Standard absorbency menstrual pads.' },
    { name: 'Vitamin C Tablets (500mg)', category: 'Vitamins', description: 'Daily Vitamin C supplement, 10 tablets.' },
    { name: 'Throat Lozenges', category: 'Wellness', description: 'Honey-lemon throat soothing lozenges.' },
    { name: 'Elastic Bandage', category: 'First Aid', description: 'Reusable compression bandage for sprains.' },
    { name: 'Hydration Sachets', category: 'Wellness', description: 'Oral rehydration salts, 3 sachets.' },
    { name: 'Disposable Gloves (pair)', category: 'Hygiene', description: 'Latex-free examination gloves.' },
  ];

  for (const p of products) {
    const existing = await Product.findOne({ name: p.name });
    if (!existing) {
      const product = await Product.create({ ...p, availabilityStatus: 'Available' });
      await InventoryItem.create({ product: product._id, quantityOnHand: Math.floor(Math.random() * 20) + 5, reorderThreshold: 3 });
      console.log(`  ➕ Product: ${p.name}`);
    }
  }

  // Default dispensing policy
  const policyExists = await DispensingPolicy.findOne({ policyStatus: 'Active' });
  if (!policyExists) {
    await DispensingPolicy.create({ policyScope: 'Both', timeWindow: 'week', maxPerUser: 3, maxPerItem: 1, policyStatus: 'Active' });
    console.log('✅ Default dispensing policy created');
  }

  console.log('🎉 Seed complete!');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
