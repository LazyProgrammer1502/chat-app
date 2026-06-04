import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageService } from '../../api/services';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import TypingIndicator from './TypingIndicator';
import { dateDivider } from '../../utils/time';
import toast from 'react-hot-toast';

export default function ChatWindow({ room }) {
  const { user }                                         = useAuth();
  const { sendMessage, markRead, setHandlers, typingMap,
          deleteMessage, onlineUsers }                   = useSocket();

  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending,     setSending]     = useState(false);

  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  const roomIdRef    = useRef(room._id);

  // Keep roomId ref fresh
  useEffect(() => { roomIdRef.current = room._id; }, [room._id]);

  // ── Load messages when room changes ──────────────────────
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setLoading(true);

    messageService.getMessages(room._id, 1)
      .then(({ data }) => {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        markRead(room._id);
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [room._id]); // eslint-disable-line

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  // ── Register socket handlers ──────────────────────────────
  useEffect(() => {
    setHandlers({
      onMessage: ({ roomId, message }) => {
        if (roomId !== roomIdRef.current) return;
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        markRead(roomIdRef.current);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      },
      onDeleted: ({ roomId, messageId }) => {
        if (roomId !== roomIdRef.current) return;
        setMessages(prev => prev.map(m =>
          m._id === messageId ? { ...m, isDeleted: true, text: '' } : m
        ));
      },
      onRead: ({ roomId }) => {
        if (roomId !== roomIdRef.current) return;
        // Mark all messages as read visually
        setMessages(prev => prev.map(m => ({ ...m, _read: true })));
      },
    });
  }, []); // eslint-disable-line

  // ── Load older messages on scroll to top ─────────────────
  const handleScroll = useCallback(async () => {
    const el = containerRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop > 80) return;

    setLoadingMore(true);
    const prevHeight = el.scrollHeight;
    try {
      const nextPage = page + 1;
      const { data } = await messageService.getMessages(room._id, nextPage);
      setMessages(prev => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(nextPage);
      // Keep scroll position after prepending
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, room._id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ── Send message ──────────────────────────────────────────
  const handleSend = useCallback(async ({ text, file, fileType }) => {
    if (sending) return;

    if (file) {
      setSending(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const uploadFn = fileType === 'image' ? messageService.uploadImage : messageService.uploadFile;
        const { data } = await uploadFn(fd);

        sendMessage({
          roomId:   room._id,
          type:     data.type,
          fileUrl:  data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          text:     '',
        }, (res) => {
          if (!res?.success) toast.error('Failed to send file');
        });
      } catch {
        toast.error('Failed to upload file');
      } finally {
        setSending(false);
      }
      return;
    }

    if (!text?.trim()) return;
    sendMessage({ roomId: room._id, type: 'text', text: text.trim() }, (res) => {
      if (!res?.success) toast.error('Failed to send message');
    });
  }, [sending, room._id, sendMessage]);

  // ── Delete message ────────────────────────────────────────
  const handleDelete = useCallback((messageId) => {
    deleteMessage(messageId, room._id, (res) => {
      if (!res?.success) toast.error('Failed to delete');
    });
  }, [room._id, deleteMessage]);

  // ── Typing users for this room ────────────────────────────
  const typers = typingMap[room._id] || {};
  const typerNames = Object.values(typers).filter(Boolean);

  // ── Get the other user for DMs (for online status) ───────
  const otherUser = room.type === 'dm'
    ? room.members?.find(m => (m._id || m).toString() !== user._id.toString())
    : null;
  const isOtherOnline = otherUser ? !!onlineUsers[otherUser._id || otherUser] : false;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <ChatHeader room={room} otherUser={otherUser} isOnline={isOtherOnline} />

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">

        {/* Load more indicator */}
        {loadingMore && (
          <div className="text-center py-2">
            <div className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loadingMore && (
          <div className="text-center py-1">
            <span className="text-xs text-gray-400">Scroll up for older messages</span>
          </div>
        )}

        {/* Skeleton */}
        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-3xl mb-2">👋</p>
              <p className="text-sm font-medium text-gray-600">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Send the first message!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDate = !prev || dateDivider(msg.createdAt) !== dateDivider(prev.createdAt);
              const showAvatar = !prev || prev.sender?._id !== msg.sender?._id ||
                new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;
              const isLast = i === messages.length - 1;

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium">{dateDivider(msg.createdAt)}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={msg.sender?._id === user._id || msg.sender === user._id}
                    showAvatar={showAvatar}
                    isLastOwn={isLast && (msg.sender?._id === user._id)}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {typerNames.length > 0 && <TypingIndicator names={typerNames} />}

        <div ref={bottomRef} />
      </div>

      <MessageInput roomId={room._id} onSend={handleSend} sending={sending} />
    </div>
  );
}

const MessagesSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
        <div className={`space-y-1 max-w-xs ${i % 2 === 0 ? 'items-end' : ''} flex flex-col`}>
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className={`h-10 bg-gray-100 rounded-2xl ${i % 2 === 0 ? 'w-40' : 'w-56'}`} />
        </div>
      </div>
    ))}
  </div>
);
