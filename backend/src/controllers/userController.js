const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

async function getProfile(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: sanitize(user) });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    await userModel.updateProfile(req.user.id, {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      country: req.body.country,
      preferred_travel_style: req.body.preferredTravelStyle,
      bio: req.body.bio,
      avatar_url: req.body.avatarUrl,
      gender: req.body.gender,
    });
    const user = await userModel.findById(req.user.id);
    res.json({ success: true, message: 'Profile updated', user: sanitize(user) });
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete your account' });
    }
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    await sessionModel.revokeAllForUser(req.user.id);
    await userModel.deleteUser(req.user.id); // cascades to all related tables via FK ON DELETE CASCADE
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, deleteAccount };
