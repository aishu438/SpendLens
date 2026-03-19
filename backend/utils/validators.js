const { validationResult } = require('express-validator');

// Middleware: if validation errors exist, return 400 with messages
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array().map(e => e.msg).join(', '),
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
