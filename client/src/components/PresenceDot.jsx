export default function PresenceDot({ status = 'offline', className = '' }) {
  const isOnline = status === 'online';
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${className} ${
        isOnline ? 'bg-signal' : 'bg-white/20'
      }`}
      title={isOnline ? 'Online' : 'Offline'}
      aria-label={isOnline ? 'Online' : 'Offline'}
    />
  );
}
