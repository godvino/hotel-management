const express = require('express');
const { body } = require('express-validator');
const {
  registerGuest,
  loginGuest,
  registerStaff,
  loginStaff,
  registerAdmin,
  loginAdmin,
  register,
  login,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const registerValidations = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidations = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// ---------------- GUEST AUTH ROUTES ----------------
router.post('/guest/register', registerValidations, registerGuest);
router.post('/guest/login', loginValidations, loginGuest);

// ---------------- STAFF AUTH ROUTES ----------------
router.post(
  '/staff/register',
  [
    ...registerValidations,
    body('staffSecretKey').notEmpty().withMessage('staffSecretKey is required for staff registration')
  ],
  registerStaff
);
router.post('/staff/login', loginValidations, loginStaff);

// ---------------- ADMIN AUTH ROUTES ----------------
router.post(
  '/admin/register',
  [
    ...registerValidations,
    body('adminSecretKey').notEmpty().withMessage('adminSecretKey is required for admin registration')
  ],
  registerAdmin
);
router.post('/admin/login', loginValidations, loginAdmin);

// ---------------- GENERAL AUTH ROUTES ----------------
router.post('/register', registerValidations, register);
router.post('/login', loginValidations, login);
router.get('/me', protect, getMe);

module.exports = router;
