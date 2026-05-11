import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => res.json({ success: true, data: [] }));
router.post('/', authenticateToken, isAdmin, async (req, res) => res.status(201).json({ success: true }));
router.put('/:id', authenticateToken, isAdmin, async (req, res) => res.json({ success: true }));
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => res.json({ success: true }));

export default router;
