const express = require('express');
const r = express.Router();
const { getMessages, uploadAttachment, deleteMessage, markRead } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadImage, uploadFile } = require('../config/cloudinary');

r.get('/:roomId',           protect, getMessages);
r.post('/upload/image',     protect, uploadImage.single('file'), uploadAttachment);
r.post('/upload/file',      protect, uploadFile.single('file'),  uploadAttachment);
r.delete('/:id',            protect, deleteMessage);
r.put('/:roomId/read',      protect, markRead);

module.exports = r;
