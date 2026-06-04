import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function MessageInput({ roomId, onSend, sending }) {
  const [text,        setText]        = useState('');
  const [filePreview, setFilePreview] = useState(null); // { file, url, type, name, size }
  const { startTyping, stopTyping }   = useSocket();
  const typingTimer  = useRef(null);
  const isTypingRef  = useRef(false);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  // Typing events
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      startTyping(roomId);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      stopTyping(roomId);
    }, 2000);
  }, [roomId, startTyping, stopTyping]);

  // Stop typing on unmount or room change
  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        stopTyping(roomId);
      }
    };
  }, [roomId, stopTyping]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setFilePreview({
      file,
      url:  isImage ? URL.createObjectURL(file) : null,
      type: isImage ? 'image' : 'file',
      name: file.name,
      size: file.size,
    });
    e.target.value = ''; // reset input
  };

  const clearFile = () => {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  };

  const handleSubmit = () => {
    if (sending) return;
    if (filePreview) {
      onSend({ file: filePreview.file, fileType: filePreview.type });
      clearFile();
      return;
    }
    if (!text.trim()) return;

    // Stop typing
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    stopTyping(roomId);

    onSend({ text });
    setText('');
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSend = !sending && (text.trim().length > 0 || !!filePreview);

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">

      {/* File preview */}
      {filePreview && (
        <div className="mb-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
          {filePreview.type === 'image' ? (
            <img src={filePreview.url} alt="preview"
              className="w-14 h-14 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{filePreview.name}</p>
            <p className="text-xs text-gray-400">{formatSize(filePreview.size)}</p>
          </div>
          <button onClick={clearFile}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* File attach button */}
        <input ref={fileInputRef} type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors shrink-0 mb-0.5"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
          </svg>
        </button>

        {/* Textarea */}
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={!!filePreview}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm resize-none focus:outline-none placeholder-gray-400 disabled:opacity-50"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`p-2.5 rounded-xl transition-all shrink-0 mb-0.5 ${
            canSend
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-300 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
