const Message     = require('../models/Message');
const Room        = require('../models/Room');
const asyncHandler = require('../utils/asyncHandler');

const getMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 30);

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  const isMember = room.members.some(m => m.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member.' });

  const total = await Message.countDocuments({ room: roomId, isDeleted: false });
  const messages = await Message.find({ room: roomId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name avatar');

  res.json({
    success: true,
    messages: messages.reverse(),
    total,
    hasMore: page < Math.ceil(total / limit),
    currentPage: page,
  });
});

const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file.' });
  res.json({
    success: true,
    fileUrl:  req.file.path,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    type: req.file.mimetype?.startsWith('image/') ? 'image' : 'file',
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ success: false, message: 'Not found.' });
  if (msg.sender.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  msg.isDeleted = true;
  msg.text = '';
  await msg.save();
  res.json({ success: true });
});

const markRead = asyncHandler(async (req, res) => {
  await Message.updateMany(
    { room: req.params.roomId, 'readBy.user': { $ne: req.user._id }, sender: { $ne: req.user._id } },
    { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
  );
  res.json({ success: true });
});

module.exports = { getMessages, uploadAttachment, deleteMessage, markRead };
