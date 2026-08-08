import { useEffect, useState } from 'react';
import { isPushSupported, getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export default function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    getCurrentSubscription()
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function handleToggle() {
    setError('');
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch (err) {
      setError(err.message || 'Could not update notification settings.');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="mt-1">
      <button
        onClick={handleToggle}
        disabled={busy}
        className="text-xs text-signal underline underline-offset-2 disabled:opacity-50"
      >
        {busy ? 'Working…' : subscribed ? 'Notifications on' : 'Enable notifications'}
      </button>
      {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}