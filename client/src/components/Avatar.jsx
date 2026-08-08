// Deterministic palette so the same person always gets the same color,
// without needing to store one. Picked from the brand's teal family plus
// enough spread to stay distinguishable, never clashing with status colors
// (amber/rose are reserved for submission states, so avoid those hues).
const PALETTE = ['#0F6E56', '#2B7A78', '#3E5C76', '#5B5F97', '#7A6F9B', '#4A7C59', '#2E6F95'];

function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 32, className = '' }) {
  const displayName = name || 'Deleted user';
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center text-white font-medium ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: name ? colorFor(displayName) : '#9CA3AF',
      }}
      title={displayName}
      aria-hidden="true"
    >
      {name ? initialsFor(displayName) : '?'}
    </div>
  );
}