const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ───────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = User.findByEmail(email);
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user  = await User.create({ name, email, password });
    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, budget: user.budget },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = User.findByEmail(email);
    if (!user || !(await User.matchPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, budget: user.budget },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────
exports.getMe = (req, res, next) => {
  try {
    const user = User.findById(req.user.id);
    res.json({ id: user.id, name: user.name, email: user.email, budget: user.budget });
  } catch (err) {
    next(err);
  }
};
