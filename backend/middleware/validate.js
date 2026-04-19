const { validationResult } = require("express-validator");

/**
 * Runs express-validator checks and returns 400 if any fail.
 * Use after defining validation rules in the route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      status: 400,
      message: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = validate;
