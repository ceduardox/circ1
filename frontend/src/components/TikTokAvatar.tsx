import { useState } from 'react';

// Muestra la foto de perfil local del TikToker (frontend/public/avatars/tiktok/<usuario>.jpg).
// Si no existe, cae a la inicial con color determinístico. Al tocar la foto se ve en grande.
export function TikTokAvatar({ username, name, size = 40, className = '', previewable = true }: { username?: string | null; name?: string | null; size?: number; className?: string; previewable?: boolean }) {
  const handle = String(username || '').replace(/^@/, '').trim();
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);
  const initial = (name || handle || '?').replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';

  if (!handle || failed) {
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

  const src = `/avatars/tiktok/${encodeURIComponent(handle)}.jpg`;

  return (
    <>
      <img
        src={src}
        alt={name || handle}
        loading="lazy"
        onError={() => setFailed(true)}
        onClick={previewable ? (e) => { e.stopPropagation(); setZoom(true); } : undefined}
        className={`rounded-full object-cover shrink-0 bg-gray-100 dark:bg-dark-700 ${previewable ? 'cursor-zoom-in' : ''} ${className}`}
        style={{ width: size, height: size }}
      />
      {zoom && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setZoom(false); }}
        >
          <img src={src} alt={name || handle} className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain bg-white shadow-2xl" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoom(false); }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center text-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
