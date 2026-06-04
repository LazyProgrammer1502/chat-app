import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { roomService } from '../api/services';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const Ctx = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [rooms,        setRooms]        = useState([]);
  const [activeRoom,   setActiveRoomSt] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const { joinRoom, setHandlers, setActiveRoom: setSocketRoom } = useSocket();

  // Only load rooms once user is authenticated — fixes the 401 loop
  useEffect(() => {
    if (!user) return;
    setLoadingRooms(true);
    roomService.getMyRooms()
      .then(({ data }) => setRooms(data.rooms))
      .catch(() => toast.error('Failed to load chats'))
      .finally(() => setLoadingRooms(false));
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register socket handlers once
  useEffect(() => {
    setHandlers({
      onRoomActivity: ({ roomId, lastMessage }) => {
        setRooms(prev =>
          [...prev]
            .map(r => r._id === roomId ? { ...r, lastMessage, lastActivity: new Date().toISOString() } : r)
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
        );
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveRoom = useCallback((room) => {
    setActiveRoomSt(room);
    setSocketRoom(room);
    if (room) joinRoom(room._id);
  }, [setSocketRoom, joinRoom]);

  const openDM = useCallback(async (userId) => {
    try {
      const { data } = await roomService.getOrCreateDM(userId);
      const room = data.room;
      setRooms(prev => prev.find(r => r._id === room._id) ? prev : [room, ...prev]);
      setActiveRoom(room);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open chat');
    }
  }, [setActiveRoom]);

  const createGroup = useCallback(async (name, memberIds) => {
    try {
      const { data } = await roomService.createGroup({ name, memberIds });
      const room = data.room;
      setRooms(prev => [room, ...prev]);
      setActiveRoom(room);
      toast.success(`"${name}" created`);
      return room;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    }
  }, [setActiveRoom]);

  return (
    <Ctx.Provider value={{
      rooms, setRooms,
      activeRoom, setActiveRoom,
      loadingRooms,
      openDM, createGroup,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useChat outside ChatProvider');
  return ctx;
};
