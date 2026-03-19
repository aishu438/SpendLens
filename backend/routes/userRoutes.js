const express = require('express');
const { body } = require('express-validator');
const { getBudget, updateBudget, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate    = require('../utils/validators');

const router = express.Router();

router.use(protect);

// GET /api/user/budget
// PUT /api/user/budget
router
  .route('/budget')
  .get(getBudget)
  .put(
    [body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number')],
    validate,
    updateBudget
  );

// PUT /api/user/profile
router.put(
  '/profile',
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  updateProfile
);

module.exports = router;
