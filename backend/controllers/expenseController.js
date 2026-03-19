const Expense = require('../models/Expense');

// ── GET /api/expenses ─────────────────────────────────────
exports.getExpenses = (req, res, next) => {
  try {
    const { month, category, page, limit } = req.query;
    const result = Expense.findAll({ userId: req.user.id, month, category, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/expenses ────────────────────────────────────
exports.createExpense = (req, res, next) => {
  try {
    const { desc, amount, date, category, note } = req.body;
    const expense = Expense.create({ userId: req.user.id, desc, amount, date, category, note });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expenses/:id ─────────────────────────────────
exports.updateExpense = (req, res, next) => {
  try {
    const expense = Expense.findById(req.params.id, req.user.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const updated = Expense.update(req.params.id, req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/expenses/:id ──────────────────────────────
exports.deleteExpense = (req, res, next) => {
  try {
    const deleted = Expense.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expenses/summary ─────────────────────────────
exports.getSummary = (req, res, next) => {
  try {
    const { month } = req.query;
    const result = Expense.summary({ userId: req.user.id, month });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
