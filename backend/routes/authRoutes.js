const express = require('express');
const authController = require('../controllers/authController.js');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty(),
    check('employeeId', 'Employee ID is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('phoneNumber', 'Phone number is required').not().isEmpty(),
    check('designation', 'Designation is required').not().isEmpty(),
  ],
  authController.register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.login
);
router.get('/users', authController.getAllUsers);


router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);

module.exports = router;