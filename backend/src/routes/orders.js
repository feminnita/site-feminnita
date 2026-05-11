import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { customer, items, payment } = req.body;
    // Create order logic
    res.status(201).json({ success: true, orderId: '123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
