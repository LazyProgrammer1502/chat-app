const express = require('express');
const r = express.Router();
const { getMyRooms, getOrCreateDM, createGroup, getRoom, leaveRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

r.get('/',            protect, getMyRooms);
r.post('/dm',         protect, getOrCreateDM);
r.post('/group',      protect, createGroup);
r.get('/:id',         protect, getRoom);
r.delete('/:id/leave',protect, leaveRoom);

module.exports = r;
