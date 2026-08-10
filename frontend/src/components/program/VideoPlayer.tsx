import { useState, useEffect, useRef } from 'react';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { Play, Pause, CheckCircle, Clock, ExternalLink } from 'lucide-react';

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
    return match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&origin=${window.location.origin}` : url;
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
  const [watchedPercent, setWatchedPercent] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin && !event.origin.includes('youtube.com') && !event.origin.includes('facebook.com')) return;
      if (event.data?.event === 'onStateChange' && event.data.data === 1) {
        setWatched(true);
      }
      if (event.data?.info?.currentTime !== undefined) {
        const percent = (event.data.info.currentTime / (duration || 1)) * 100;
        setWatchedPercent(Math.min(100, percent));
        if (percent >= 80) setWatched(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-6 rounded-xl border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-300' 
        : 'bg-blue-50 border-blue-300'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl mt-1">📹</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      </div>

      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative mb-4">
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

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Duración: {duration ? formatTime(duration) : 'Desconocida'}</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300" 
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
          <span>{Math.round(watchedPercent)}%</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600">
          <ExternalLink className="w-3 h-3" />
          Ver en {provider}
        </a>
      </div>

      {completed || watched ? (
        <div className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{completed ? 'Completado' : 'Visto >80% - Marcado como completado'}</span>
        </div>
      ) : (
        <ButtonPrimary onClick={onComplete} className="w-full" disabled={!watched}>
          <CheckCircle className="w-4 h-4 mr-2" />
          {watched ? 'Marcar como completado' : 'Mira al menos el 80% para continuar'}
        </ButtonPrimary>
      )}
    </div>
  );
}
