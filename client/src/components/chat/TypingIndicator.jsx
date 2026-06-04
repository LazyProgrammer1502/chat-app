export default function TypingIndicator({ names = [] }) {
  if (names.length === 0) return null;

  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : 'Several people are typing';

  return (
    <div className="flex items-end gap-2 mb-1">
      <div className="w-8 shrink-0" /> {/* spacer for avatar alignment */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}
