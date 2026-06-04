const Room        = require('../models/Room');
const Message     = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');

const POPULATE_MEMBERS = { path: 'members', select: 'name email avatar isOnline lastSeen' };
const POPULATE_LAST    = { path: 'lastMessage', populate: { path: 'sender', select: 'name' } };

const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ members: req.user._id })
    .sort({ lastActivity: -1 })
    .populate(POPULATE_MEMBERS)
    .populate(POPULATE_LAST);
  res.json({ success: true, rooms });
});

const getOrCreateDM = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required.' });
  if (userId === req.user._id.toString())
    return res.status(400).json({ success: false, message: 'Cannot DM yourself.' });

  let room = await Room.findOne({
    type: 'dm',
    members: { $all: [req.user._id, userId], $size: 2 },
  }).populate(POPULATE_MEMBERS).populate(POPULATE_LAST);

  if (!room) {
    room = await Room.create({ type: 'dm', members: [req.user._id, userId] });
    await room.populate(POPULATE_MEMBERS);
  }
  res.json({ success: true, room });
});

const createGroup = asyncHandler(async (req, res) => {
  const { name, memberIds = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name required.' });
  const members = [...new Set([req.user._id.toString(), ...memberIds])];
  if (members.length < 2) return res.status(400).json({ success: false, message: 'Need 2+ members.' });
  const room = await Room.create({ type: 'group', name: name.trim(), members, admin: req.user._id });
  await room.populate(POPULATE_MEMBERS);
  res.status(201).json({ success: true, room });
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate(POPULATE_MEMBERS);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  const isMember = room.members.some(m => m._id.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member.' });
  res.json({ success: true, room });
});

const leaveRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
  room.members = room.members.filter(m => m.toString() !== req.user._id.toString());
  if (room.type === 'group' && room.admin?.toString() === req.user._id.toString()) {
    room.admin = room.members[0] || null;
  }
  if (room.members.length === 0) {
    await Room.findByIdAndDelete(room._id);
    await Message.deleteMany({ room: room._id });
    return res.json({ success: true, message: 'Room deleted.' });
  }
  await room.save();
  res.json({ success: true, message: 'Left room.' });
});

module.exports = { getMyRooms, getOrCreateDM, createGroup, getRoom, leaveRoom };
