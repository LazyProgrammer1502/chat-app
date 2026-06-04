export default function EmptyChat() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">💬</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Select a chat</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Search for someone in the sidebar to start a conversation, or open an existing chat.
        </p>
      </div>
    </div>
  );
}
