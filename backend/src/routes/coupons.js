import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, isAdmin, async (req, res) => res.json({ success: true, data: [] }));
router.post('/', authenticateToken, isAdmin, async (req, res) => res.status(201).json({ success: true }));
router.post('/validate', async (req, res) => res.json({ valid: true, discount: 10 }));

export default router;
