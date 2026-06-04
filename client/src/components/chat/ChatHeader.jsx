import Avatar from '../ui/Avatar';
import { timeAgo } from '../../utils/time';

export default function ChatHeader({ room, otherUser, isOnline }) {
  const isGroup = room.type === 'group';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
      {isGroup ? (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
          {room.name?.[0]?.toUpperCase()}
        </div>
      ) : (
        <Avatar user={otherUser} size="md" online={isOnline} />
      )}

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

      {/* Group members avatars */}
      {isGroup && room.members?.length > 0 && (
        <div className="flex -space-x-2">
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
