import api from './axios';

export const authService = {
  register:     (d)  => api.post('/auth/register', d),
  login:        (d)  => api.post('/auth/login', d),
  getMe:        ()   => api.get('/auth/me'),
  updateMe:     (d)  => api.put('/auth/me', d),
  uploadAvatar: (fd) => api.put('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  searchUsers:  (q)  => api.get(`/auth/search?q=${encodeURIComponent(q)}`),
};

export const roomService = {
  getMyRooms:    ()         => api.get('/rooms'),
  getOrCreateDM: (userId)   => api.post('/rooms/dm', { userId }),
  createGroup:   (d)        => api.post('/rooms/group', d),
  leaveRoom:     (id)       => api.delete(`/rooms/${id}/leave`),
};

export const messageService = {
  getMessages:  (roomId, page = 1) => api.get(`/messages/${roomId}?page=${page}&limit=30`),
  uploadImage:  (fd) => api.post('/messages/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadFile:   (fd) => api.post('/messages/upload/file',  fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markRead:     (roomId) => api.put(`/messages/${roomId}/read`),
};
