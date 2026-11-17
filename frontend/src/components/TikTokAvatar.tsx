import { useState } from 'react';

// Muestra la foto de perfil local del TikToker (frontend/public/avatars/tiktok/<usuario>.jpg).
// Si no existe, cae a la inicial con color determinístico.
export function TikTokAvatar({ username, name, size = 40, className = '' }: { username?: string | null; name?: string | null; size?: number; className?: string }) {
  const handle = String(username || '').replace(/^@/, '').trim();
  const [failed, setFailed] = useState(false);
  const initial = (name || handle || '?').replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';

  if (!handle || failed) {
    // color determinístico por usuario
    let hash = 0;
    for (let i = 0; i < handle.length; i++) hash = (hash * 31 + handle.charCodeAt(i)) % 360;
    return (
      <div
        className={`rounded-full text-white flex items-center justify-center font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: `linear-gradient(135deg, hsl(${hash} 70% 50%), hsl(${(hash + 40) % 360} 70% 42%))` }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={`/avatars/tiktok/${encodeURIComponent(handle)}.jpg`}
      alt={name || handle}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover shrink-0 bg-gray-100 dark:bg-dark-700 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
