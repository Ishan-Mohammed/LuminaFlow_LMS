import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbGet, dbRun, dbAll } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Middleware to authenticate JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      error: 'Access token is required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'Invalid or expired token'
      });
    }
    req.user = decodedUser;
    next();
  });
};

// Middleware to authorize roles
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      const errMsg = `Forbidden: Requires ${role} role`;
      return res.status(403).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }
    next();
  };
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      const errMsg = 'All fields are required (name, email, password, role)';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    if (role !== 'student' && role !== 'mentor') {
      const errMsg = 'Invalid role. Must be either student or mentor';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    // Check if user already exists
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      const errMsg = 'An account with this email already exists';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Insert user
    await dbRun(
      'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role, createdAt]
    );

    // Create JWT token
    const token = jwt.sign({ id: userId, name, email, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, name, email, role, selected_course_id: null, selected_bootcamp_level: 'Beginner' }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: 'Server error during registration'
    });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const errMsg = 'Email and password are required';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    // Find user
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const errMsg = 'Invalid email or password';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const errMsg = 'Invalid email or password';
      return res.status(400).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }

    // Create token
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, selected_course_id: user.selected_course_id, selected_bootcamp_level: user.selected_bootcamp_level || 'Beginner' }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: 'Server error during login'
    });
  }
};

// Check Current Session
export const getMe = async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, role, createdAt, selected_course_id, selected_bootcamp_level FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      const errMsg = 'User not found';
      return res.status(404).json({
        success: false,
        message: errMsg,
        error: errMsg
      });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user session error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving session',
      error: 'Server error retrieving session'
    });
  }
};
