import { useState, useEffect, useRef } from 'react';
import { ButtonPrimary } from '@/components/ui';
import { Play, CheckCircle, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  url: string;
  provider: 'facebook' | 'youtube' | 'vimeo' | 'direct';
  duration?: number;
  description?: string;
  author?: string;
  onComplete: () => void;
  completed?: boolean;
  autoplay?: boolean;
}

function getEmbedUrl(url: string, provider: string): string {
  if (provider === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }
  if (provider === 'facebook') {
    // Los reels y videos de Facebook se embeben con el plugin oficial.
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=100%`;
  }
  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

// Detectar si la URL es un reel (más restrictivo que un video normal).
function isReel(url: string): boolean {
  return /\/reel\/|\/reels\//.test(url);
}

export function VideoPlayer({ title, url, provider, duration, description, author, onComplete, completed, autoplay = false }: VideoPlayerProps) {
  const [watched, setWatched] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoHeight > v.videoWidth) setIsVertical(true);
  };

  const handleMarkWatched = async () => {
    await onComplete();
    setWatched(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-300' 
        : 'bg-blue-50 border-blue-300'
    }`}>
      <div className="flex items-start gap-3 mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl mt-0.5">📹</span>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{description}</p>}
        </div>
      </div>

      <div className={`bg-gray-900 rounded-lg overflow-hidden relative mb-3 sm:mb-4 ${isVertical ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-video'}`}>
        {provider === 'direct' ? (
          // Video descargado en el servidor: se reproduce directamente en la app.
          <video
            src={url}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIframeLoaded(true)}
          />
        ) : provider === 'facebook' && isReel(url) ? (
          // Los reels de Facebook no se reproducen dentro de la app si la sesión
          // no está activa en el navegador. Mostramos un panel para abrirlo directo.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <span className="text-4xl">🎬</span>
            {author && (
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Crédito: {author}
              </p>
            )}
            <p className="font-bold text-lg">Este video se abre en Facebook</p>
            <p className="text-sm text-white/80 max-w-xs">
              Facebook no permite reproducir reels dentro de otras páginas. Tócalo para verlo y luego vuelve a marcar la tarea.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir video en Facebook
            </a>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              src={getEmbedUrl(url, provider)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full"
              onLoad={() => setIframeLoaded(true)}
            />
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <ButtonPrimary size="lg" onClick={() => iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')}>
                  <Play className="w-6 h-6" />
                </ButtonPrimary>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        <div />
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600 shrink-0">
          <ExternalLink className="w-3 h-3" />
          {provider}
        </a>
      </div>

      {completed || watched ? (
        <div className="flex items-center justify-center gap-2 text-green-600 p-3 sm:p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">Completado</span>
        </div>
      ) : (
        <ButtonPrimary onClick={handleMarkWatched} className="w-full">
          <CheckCircle className="w-4 h-4 mr-2" />
          Marcar como visto y continuar
        </ButtonPrimary>
      )}
    </div>
  );
}
