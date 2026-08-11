import { useState, useEffect, useRef } from 'react';
import { ButtonPrimary } from '@/components/ui';
import { Play, CheckCircle, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  url: string;
  provider: 'facebook' | 'youtube' | 'vimeo' | 'direct';
  duration?: number;
  description?: string;
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
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=100%`;
  }
  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

export function VideoPlayer({ title, url, provider, duration, description, onComplete, completed, autoplay = false }: VideoPlayerProps) {
  const [watched, setWatched] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative mb-3 sm:mb-4">
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
