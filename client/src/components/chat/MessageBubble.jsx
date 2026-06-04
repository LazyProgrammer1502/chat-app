import { useState } from 'react';
import Avatar from '../ui/Avatar';
import { timeStamp } from '../../utils/time';

export default function MessageBubble({ message, isOwn, showAvatar, isLastOwn, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const { sender, type, text, fileUrl, fileName, fileSize, isDeleted, readBy, createdAt } = message;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end mb-1`}>

      {/* Avatar — only show for others, and only when sender changes */}
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar && <Avatar user={sender} size="sm" />}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name for groups */}
        {!isOwn && showAvatar && sender?.name && (
          <span className="text-xs text-gray-500 font-medium mb-1 ml-1">{sender.name}</span>
        )}

        <div className="relative flex items-end gap-1">
          {/* Delete button — own messages only */}
          {isOwn && !isDeleted && (
            <button
              onClick={() => setShowMenu(v => !v)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg mb-0.5"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          )}

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10 w-28">
              <button
                onClick={() => { onDelete(message._id); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {/* Bubble */}
          {isDeleted ? (
            <div className={`px-4 py-2 rounded-2xl text-sm italic text-gray-400 border border-dashed border-gray-200 ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              🚫 Message deleted
            </div>
          ) : type === 'image' ? (
            <a href={fileUrl} target="_blank" rel="noreferrer">
              <img src={fileUrl} alt={fileName || 'Image'}
                className={`max-w-xs rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{ maxHeight: '300px' }}
              />
            </a>
          ) : type === 'file' ? (
            <a href={fileUrl} target="_blank" rel="noreferrer"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm no-underline transition-colors ${
                isOwn
                  ? 'bg-blue-600 text-white hover:bg-blue-700 rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-bl-sm'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-blue-500' : 'bg-white'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate max-w-[160px]">{fileName || 'File'}</p>
                {fileSize > 0 && <p className={`text-xs mt-0.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>{formatSize(fileSize)}</p>}
              </div>
            </a>
          ) : (
            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isOwn
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}>
              {text}
            </div>
          )}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 mx-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-400">{timeStamp(createdAt)}</span>
          {isOwn && isLastOwn && !isDeleted && (
            <ReadReceipt readBy={readBy} />
          )}
        </div>
      </div>
    </div>
  );
}

const ReadReceipt = ({ readBy = [] }) => {
  // readBy includes sender — actual readers are everyone else
  const readers = readBy.filter(r => r);
  const isSeen  = readers.length > 1; // more than just sender

  return (
    <span title={isSeen ? 'Seen' : 'Delivered'}>
      {isSeen ? (
        // Double blue tick
        <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1.5 12.5L6 17 14 9M7.5 12.5L12 17 20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ) : (
        // Single grey tick
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </span>
  );
};
