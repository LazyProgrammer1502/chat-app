import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { authService } from '../../api/services';
import Avatar from '../ui/Avatar';
import { timeAgo } from '../../utils/time';
import toast from 'react-hot-toast';

export default function Sidebar({ onNewGroup }) {
  const { user, logout }                         = useAuth();
  const { rooms, activeRoom, setActiveRoom, openDM, loadingRooms } = useChat();
  const { connected, onlineUsers, unreadMap }    = useSocket();

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await authService.searchUsers(query.trim());
        setResults(data.users);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const handleSelectUser = (u) => {
    openDM(u._id);
    onRoomSelect?.();
    setQuery('');
    setResults([]);
  };

  // Derive display name + other user for DMs
  const roomMeta = (room) => {
    if (room.type === 'group') return { name: room.name, user: null };
    const other = room.members?.find(m => (m._id || m) !== user._id && m._id !== user._id);
    return { name: other?.name || 'Unknown', user: other };
  };

  const lastMsgPreview = (room) => {
    const m = room.lastMessage;
    if (!m) return 'No messages yet';
    if (m.isDeleted) return '🚫 Deleted';
    if (m.type === 'image') return '📷 Image';
    if (m.type === 'file')  return '📎 File';
    return m.text || '';
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-lg">💬 Chats</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} title={connected ? 'Online' : 'Connecting…'} />
        </div>
        <div className="flex gap-1">
          <button onClick={onNewGroup} title="New group"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          <button onClick={() => { logout(); toast.success('Logged out'); }} title="Logout"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Current user */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <Avatar user={user} size="sm" online={true} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-50">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full bg-gray-50 border-0 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600">✕</button>
          )}
        </div>

        {/* Search results */}
        {(searching || results.length > 0) && (
          <div className="mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
            {searching
              ? <p className="px-4 py-3 text-sm text-gray-400 text-center">Searching…</p>
              : results.map(u => (
                <button key={u._id} onClick={() => handleSelectUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
                  <Avatar user={u} size="sm" online={!!onlineUsers[u._id]} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </button>
              ))
            }
          </div>
        )}
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto">
        {loadingRooms ? (
          <div className="space-y-0 animate-pulse py-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm font-medium text-gray-600 mb-1">No chats yet</p>
            <p className="text-xs text-gray-400">Search for someone above</p>
          </div>
        ) : (
          <div className="py-1">
            {rooms.map(room => {
              const { name, user: other } = roomMeta(room);
              const isActive = activeRoom?._id === room._id;
              const isOnline = other ? !!onlineUsers[other._id] : false;
              const unread   = unreadMap[room._id] || 0;

              return (
                <button key={room._id} onClick={() => { setActiveRoom(room); onRoomSelect?.(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    isActive ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'
                  }`}>
                  {room.type === 'group'
                    ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {name[0]?.toUpperCase()}
                      </div>
                    : <Avatar user={other} size="md" online={isOnline} />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${isActive ? 'font-semibold text-blue-700' : 'font-medium text-gray-900'}`}>
                        {name}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">
                        {room.lastMessage ? timeAgo(room.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-400 truncate">{lastMsgPreview(room)}</p>
                      {unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shrink-0 ml-1 font-medium">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
