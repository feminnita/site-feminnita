import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', async (req, res) => res.json({ success: true, data: [] }));
router.post('/', authenticateToken, async (req, res) => res.status(201).json({ success: true }));

export default router;
