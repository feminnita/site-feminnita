import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to database
    // const user = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in database
    // const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    // Mock user for example
    const user = { id: 1, email, role: 'admin' };

    // Verify password
    // const validPassword = await bcrypt.compare(password, user.password_hash);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
