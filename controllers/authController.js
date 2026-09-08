const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generic login helper that validates role if expectedRole is provided
const authenticateUserByRole = async (email, password, expectedRole, res, next) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    // Role-specific check
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied: This account has role '${user.role}' and is not authorized to log in via the ${expectedRole.toUpperCase()} portal.`,
        errorCode: 'INVALID_PORTAL_ROLE'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `${user.role.toUpperCase()} authentication successful`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// 1. GUEST AUTHENTICATION
// -------------------------------------------------------------

// @desc    Register Guest account
// @route   POST /api/auth/guest/register
// @access  Public
const registerGuest = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        errorCode: 'DUPLICATE_EMAIL'
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: 'guest',
      phone: phone || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Guest account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login Guest account
// @route   POST /api/auth/guest/login
// @access  Public
const loginGuest = async (req, res, next) => {
  const { email, password } = req.body;
  await authenticateUserByRole(email, password, 'guest', res, next);
};

// -------------------------------------------------------------
// 2. STAFF AUTHENTICATION
// -------------------------------------------------------------

// @desc    Register Staff account
// @route   POST /api/auth/staff/register
// @access  Public (Requires Staff Secret / Admin Authorization)
const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, staffSecretKey } = req.body;

    const requiredSecret = process.env.STAFF_SECRET_KEY || 'STAFF2026';
    if (staffSecretKey !== requiredSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid staff registration secret key. Staff accounts require authorization.',
        errorCode: 'INVALID_STAFF_SECRET'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        errorCode: 'DUPLICATE_EMAIL'
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: 'staff',
      phone: phone || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Hotel Staff account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login Staff account
// @route   POST /api/auth/staff/login
// @access  Public
const loginStaff = async (req, res, next) => {
  const { email, password } = req.body;
  await authenticateUserByRole(email, password, 'staff', res, next);
};

// -------------------------------------------------------------
// 3. ADMIN AUTHENTICATION
// -------------------------------------------------------------

// @desc    Register Admin account
// @route   POST /api/auth/admin/register
// @access  Public (Requires Admin Secret)
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, adminSecretKey } = req.body;

    const requiredSecret = process.env.ADMIN_SECRET_KEY || 'ADMIN2026';
    if (adminSecretKey !== requiredSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin secret key. Administrative account creation is restricted.',
        errorCode: 'INVALID_ADMIN_SECRET'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
        errorCode: 'DUPLICATE_EMAIL'
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: 'admin',
      phone: phone || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Administrator account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login Admin account
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;
  await authenticateUserByRole(email, password, 'admin', res, next);
};

// -------------------------------------------------------------
// GENERAL / BACKWARD-COMPATIBLE AUTHENTICATION
// -------------------------------------------------------------

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
        errorCode: 'DUPLICATE_EMAIL'
      });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'guest',
      phone: phone || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  await authenticateUserByRole(email, password, null, res, next);
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerGuest,
  loginGuest,
  registerStaff,
  loginStaff,
  registerAdmin,
  loginAdmin,
  register,
  login,
  getMe
};
