const { authenticateSocket } = require('../middleware/auth');
const User    = require('../models/User');
const Room    = require('../models/Room');
const Message = require('../models/Message');

// In-memory typing tracker: { roomId: Set<userId> }
const typing = {};

module.exports = (io) => {
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🟢 ${user.name} connected (${socket.id})`);

    // ── Mark online ──────────────────────────────────────
    await User.findByIdAndUpdate(user._id, { isOnline: true, socketId: socket.id, lastSeen: new Date() });

    // ── Auto-join all user's rooms ───────────────────────
    const rooms = await Room.find({ members: user._id }).select('_id');
    const roomIds = rooms.map(r => r._id.toString());
    roomIds.forEach(id => socket.join(id));

    // ── Broadcast online to shared rooms ─────────────────
    socket.to(roomIds).emit('presence', { userId: user._id.toString(), isOnline: true });

    // ── SEND MESSAGE ─────────────────────────────────────
    socket.on('send_message', async (data, ack) => {
      try {
        const { roomId, text = '', type = 'text', fileUrl = '', fileName = '', fileSize = 0 } = data;

        const room = await Room.findOne({ _id: roomId, members: user._id });
        if (!room) return ack?.({ success: false, message: 'Room not found.' });
        if (type === 'text' && !text.trim()) return ack?.({ success: false, message: 'Empty message.' });

        const msg = await Message.create({
          room: roomId, sender: user._id,
          type, text: text.trim(), fileUrl, fileName, fileSize,
          readBy: [{ user: user._id, readAt: new Date() }],
        });
        await msg.populate('sender', 'name avatar');

        await Room.findByIdAndUpdate(roomId, { lastMessage: msg._id, lastActivity: new Date() });

        // Clear typing
        _clearTyping(io, socket, roomId, user._id.toString());

        // Emit to whole room
        io.to(roomId).emit('new_message', { roomId, message: msg });
        ack?.({ success: true, message: msg });
      } catch (err) {
        console.error('send_message:', err.message);
        ack?.({ success: false, message: 'Failed to send.' });
      }
    });

    // ── TYPING ────────────────────────────────────────────
    socket.on('typing_start', ({ roomId }) => {
      if (!typing[roomId]) typing[roomId] = new Set();
      typing[roomId].add(user._id.toString());
      socket.to(roomId).emit('typing', { roomId, userId: user._id.toString(), name: user.name, isTyping: true });
    });

    socket.on('typing_stop', ({ roomId }) => {
      _clearTyping(io, socket, roomId, user._id.toString());
    });

    // ── READ RECEIPTS ─────────────────────────────────────
    socket.on('mark_read', async ({ roomId }) => {
      try {
        await Message.updateMany(
          { room: roomId, 'readBy.user': { $ne: user._id }, sender: { $ne: user._id } },
          { $push: { readBy: { user: user._id, readAt: new Date() } } }
        );
        io.to(roomId).emit('messages_read', { roomId, userId: user._id.toString() });
      } catch (err) {
        console.error('mark_read:', err.message);
      }
    });

    // ── JOIN NEW ROOM (after DM/group created) ────────────
    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
    });

    // ── DELETE MESSAGE ────────────────────────────────────
    socket.on('delete_message', async ({ messageId, roomId }, ack) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.sender.toString() !== user._id.toString())
          return ack?.({ success: false });
        msg.isDeleted = true;
        msg.text = '';
        await msg.save();
        io.to(roomId).emit('message_deleted', { roomId, messageId });
        ack?.({ success: true });
      } catch (err) {
        console.error('delete_message:', err.message);
        ack?.({ success: false });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 ${user.name} disconnected`);
      await User.findByIdAndUpdate(user._id, { isOnline: false, socketId: '', lastSeen: new Date() });

      // Clear any typing this user left behind
      Object.keys(typing).forEach(roomId => {
        if (typing[roomId]?.has(user._id.toString())) {
          _clearTyping(io, socket, roomId, user._id.toString());
        }
      });

      // Broadcast offline
      socket.to(roomIds).emit('presence', { userId: user._id.toString(), isOnline: false, lastSeen: new Date() });
    });
  });
};

function _clearTyping(io, socket, roomId, userId) {
  if (typing[roomId]) {
    typing[roomId].delete(userId);
    if (typing[roomId].size === 0) delete typing[roomId];
  }
  // Always broadcast the cleared state
  socket.to(roomId).emit('typing', {
    roomId,
    userId,
    isTyping: false,
    active: typing[roomId] ? [...typing[roomId]] : [],
  });
}
