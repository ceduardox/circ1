import { useState } from 'react';

export function TikTokAvatar({ username, name, size = 40, className = '' }: { username?: string | null; name?: string | null; size?: number; className?: string }) {
  const handle = String(username || '').replace(/^@/, '').trim();
  const [failed, setFailed] = useState(false);
  const initial = (name || handle || '?').replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';

  if (!handle || failed) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={`https://unavatar.io/tiktok/${handle}`}
      alt={name || handle}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 bg-gray-100 dark:bg-dark-700 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
