const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type:         { type: String, enum: ['dm', 'group'], required: true },
  name:         { type: String, trim: true, maxlength: 60 },
  avatar:       { type: String, default: '' },
  members:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

roomSchema.index({ members: 1 });

module.exports = mongoose.model('Room', roomSchema);
