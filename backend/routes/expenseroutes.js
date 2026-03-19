const express = require('express');
const { body } = require('express-validator');
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const validate    = require('../utils/validators');

const router = express.Router();

// All routes are protected
router.use(protect);

const expenseBodyRules = [
  body('desc').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be YYYY-MM-DD'),
  body('category')
    .optional()
    .isIn(['Food', 'Transport', 'Housing', 'Health', 'Entertainment', 'Shopping', 'Other'])
    .withMessage('Invalid category'),
];

// GET  /api/expenses          — list (with optional ?month=&category=)
// POST /api/expenses          — create
router
  .route('/')
  .get(getExpenses)
  .post(expenseBodyRules, validate, createExpense);

// GET  /api/expenses/summary  — category totals for a month
router.get('/summary', getSummary);

// PUT  /api/expenses/:id      — update
// DELETE /api/expenses/:id    — delete
router
  .route('/:id')
  .put(expenseBodyRules, validate, updateExpense)
  .delete(deleteExpense);

module.exports = router;
