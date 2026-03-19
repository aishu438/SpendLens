const User = require('../models/User');

// ── GET /api/user/budget ──────────────────────────────────
exports.getBudget = (req, res, next) => {
  try {
    const user = User.findById(req.user.id);
    res.json({ budget: user.budget });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/user/budget ──────────────────────────────────
exports.updateBudget = (req, res, next) => {
  try {
    const { budget } = req.body;
    if (budget === undefined || budget < 0) {
      return res.status(400).json({ message: 'Budget must be a non-negative number' });
    }
    const user = User.updateBudget(req.user.id, budget);
    res.json({ budget: user.budget });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/user/profile ─────────────────────────────────
exports.updateProfile = (req, res, next) => {
  try {
    const { name } = req.body;
    const user = User.updateProfile(req.user.id, { name });
    res.json({ id: user.id, name: user.name, email: user.email, budget: user.budget });
  } catch (err) {
    next(err);
  }
};
