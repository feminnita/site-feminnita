import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', authenticateToken, async (req, res) => res.json({ success: true, data: {} }));
router.put('/:id', authenticateToken, async (req, res) => res.json({ success: true }));

export default router;
