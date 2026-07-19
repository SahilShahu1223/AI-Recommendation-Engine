const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const SIGNUP_BONUS = Number(process.env.SIGNUP_BONUS_CREDITS) || 5;

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

async function register(req, res, next) {
  try {
    const {
      firstName, lastName, email, password, confirmPassword,
      dateOfBirth, gender, country, preferredTravelStyle,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !dateOfBirth || !country) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await userModel.findByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = await userModel.createUser({
      firstName, lastName,
      email: email.toLowerCase().trim(),
      passwordHash,
      dateOfBirth,
      gender: gender || 'prefer_not_to_say',
      country,
      preferredTravelStyle: preferredTravelStyle || 'comfort',
      credits: SIGNUP_BONUS,
    });

    const user = await userModel.findById(userId);
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessionModel.createSession({
      userId: user.id, refreshToken, userAgent: req.headers['user-agent'], ipAddress: req.ip, expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await userModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessionModel.createSession({
      userId: user.id, refreshToken, userAgent: req.headers['user-agent'], ipAddress: req.ip, expiresAt,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken is required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const session = await sessionModel.findActiveSession(refreshToken);
    if (!session) return res.status(401).json({ success: false, message: 'Session revoked or expired' });

    const user = await userModel.findById(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await sessionModel.revokeSession(refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
