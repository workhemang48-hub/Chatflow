// The "socket bracket" mark: two open brackets holding a single dot —
// a persistent connection held open, not a message bubble.
export default function Logo({ size = 28, withWordmark = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 8C10 8 8 11 8 16v8c0 5 2 8 6 8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M26 8c4 0 6 3 6 8v8c0 5-2 8-6 8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="4" fill="currentColor" />
      </svg>
      {withWordmark && (
        <span className="font-display text-xl lowercase tracking-tight">chatflow</span>
      )}
    </span>
  );
}
