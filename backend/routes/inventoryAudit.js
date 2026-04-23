const express = require('express');
const invRouter = express.Router();
const auditRouter = express.Router();
const { getInventory, updateInventory, getPolicy, updatePolicy } = require('../controllers/inventoryController');
const { getLogs, getSummary, exportCSV } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Inventory routes (admin)
invRouter.get('/', protect, requireRole('Administrator'), getInventory);
invRouter.patch('/:productId', protect, requireRole('Administrator'), updateInventory);
invRouter.get('/policy', protect, requireRole('Administrator'), getPolicy);
invRouter.put('/policy', protect, requireRole('Administrator'), updatePolicy);

// Audit routes (admin)
auditRouter.get('/', protect, requireRole('Administrator'), getLogs);
auditRouter.get('/summary', protect, requireRole('Administrator'), getSummary);
auditRouter.get('/export/csv', protect, requireRole('Administrator'), exportCSV);

module.exports = { invRouter, auditRouter };
