export default function TypingIndicator({ names = [] }) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink/50 font-mono">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-flow animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-flow animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-flow animate-bounce" />
      </span>
      {label}…
    </div>
  );
}
