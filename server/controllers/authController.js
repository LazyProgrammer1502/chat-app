const User        = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenResponse } = require('../utils/generateToken');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields required.' });
  if (await User.findOne({ email }))
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  sendTokenResponse(user, 200, res);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, bio } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (bio  !== undefined) updates.bio = bio.trim();
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file.' });
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: req.file.path }, { new: true });
  res.json({ success: true, avatar: user.avatar, user });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ success: false, message: 'Query must be 2+ chars.' });
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name:  { $regex: q.trim(), $options: 'i' } },
      { email: { $regex: q.trim(), $options: 'i' } },
    ],
  }).select('name email avatar isOnline lastSeen').limit(10);
  res.json({ success: true, users });
});

module.exports = { register, login, getMe, updateMe, uploadAvatar, searchUsers };
