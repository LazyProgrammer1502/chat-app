import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
const SERVER = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef   = useRef(null);
  const handlersRef = useRef({});          // { onMessage, onDeleted, onRead, onPresence, onTyping, onRoomActivity }
  const [connected,   setConnected]   = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});  // { userId: true/false }
  const [typingMap,   setTypingMap]   = useState({});  // { roomId: { userId: name } }
  const [unreadMap,   setUnreadMap]   = useState({});  // { roomId: count }
  const activeRoomRef = useRef(null);                  // set by ChatContext

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io(SERVER, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = s;

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', e => console.error('Socket:', e.message));

    // Presence
    s.on('presence', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: isOnline }));
      handlersRef.current.onPresence?.({ userId, isOnline, lastSeen });
    });

    // New message
    s.on('new_message', ({ roomId, message }) => {
      handlersRef.current.onMessage?.({ roomId, message });
      handlersRef.current.onRoomActivity?.({ roomId, lastMessage: message });
      // Increment unread only if not in this room
      if (activeRoomRef.current?._id !== roomId) {
        setUnreadMap(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
      }
    });

    // Deleted
    s.on('message_deleted', ({ roomId, messageId }) => {
      handlersRef.current.onDeleted?.({ roomId, messageId });
    });

    // Read
    s.on('messages_read', ({ roomId, userId }) => {
      handlersRef.current.onRead?.({ roomId, userId });
    });

    // Typing
    s.on('typing', ({ roomId, userId, name, isTyping }) => {
      setTypingMap(prev => {
        const room = { ...(prev[roomId] || {}) };
        if (isTyping) room[userId] = name;
        else delete room[userId];
        return { ...prev, [roomId]: room };
      });
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, [user?._id]); // primitive dep — no object reference loops

  // ── Emitters ─────────────────────────────────────────────
  const emit = (event, data, ack) => socketRef.current?.emit(event, data, ack);

  const sendMessage    = (data, ack)         => emit('send_message',  data, ack);
  const startTyping    = (roomId)            => emit('typing_start',  { roomId });
  const stopTyping     = (roomId)            => emit('typing_stop',   { roomId });
  const markRead       = (roomId)            => { emit('mark_read', { roomId }); setUnreadMap(p => ({ ...p, [roomId]: 0 })); };
  const joinRoom       = (roomId)            => emit('join_room',     { roomId });
  const deleteMessage  = (messageId, roomId, ack) => emit('delete_message', { messageId, roomId }, ack);
  const clearUnread    = (roomId)            => setUnreadMap(p => ({ ...p, [roomId]: 0 }));

  // Called by ChatContext to register callbacks
  const setHandlers = (handlers) => { handlersRef.current = { ...handlersRef.current, ...handlers }; };
  const setActiveRoom = (room) => { activeRoomRef.current = room; };

  return (
    <Ctx.Provider value={{
      connected, onlineUsers, typingMap, unreadMap,
      sendMessage, startTyping, stopTyping, markRead,
      joinRoom, deleteMessage, clearUnread,
      setHandlers, setActiveRoom,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSocket outside SocketProvider');
  return ctx;
};
