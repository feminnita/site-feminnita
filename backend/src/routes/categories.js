import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    // Database query here
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Create category logic
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
