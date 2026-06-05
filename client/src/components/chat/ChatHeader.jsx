import Avatar from '../ui/Avatar';
import { timeAgo } from '../../utils/time';

export default function ChatHeader({ room, otherUser, isOnline, onBack }) {
  const isGroup = room.type === 'group';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">

      {/* Back button — always shown, goes back to sidebar on mobile */}
      <button
        onClick={onBack}
        className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 shrink-0 md:hidden"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* Avatar */}
      {isGroup ? (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
          {room.name?.[0]?.toUpperCase()}
        </div>
      ) : (
        <Avatar user={otherUser} size="md" online={isOnline} />
      )}

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {isGroup ? room.name : otherUser?.name || 'Unknown'}
        </p>
        <p className="text-xs text-gray-400">
          {isGroup
            ? `${room.members?.length || 0} members`
            : isOnline
              ? '🟢 Online'
              : otherUser?.lastSeen
                ? `Last seen ${timeAgo(otherUser.lastSeen)}`
                : 'Offline'
          }
        </p>
      </div>

      {/* Group member avatars */}
      {isGroup && room.members?.length > 0 && (
        <div className="hidden sm:flex -space-x-2 shrink-0">
          {room.members.slice(0, 4).map(m => (
            <Avatar key={m._id} user={m} size="xs" />
          ))}
          {room.members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 ring-2 ring-white">
              +{room.members.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
