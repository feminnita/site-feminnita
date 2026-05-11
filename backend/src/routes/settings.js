import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => res.json({ success: true, data: {} }));
router.put('/', authenticateToken, isAdmin, async (req, res) => res.json({ success: true }));

export default router;
