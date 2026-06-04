const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  text:      { type: String, maxlength: 2000, default: '' },
  fileUrl:   { type: String, default: '' },
  fileName:  { type: String, default: '' },
  fileSize:  { type: Number, default: 0 },
  readBy: [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
