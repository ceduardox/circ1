import { useEffect, useState, useRef } from 'react';
import { FileText, Link2, Loader2, Copy, Check, History, Trash2, RefreshCw, PlayCircle, Download } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button, ButtonPrimary, Input, Label, PageHeader } from '@/components/ui';
import { toast } from 'sonner';

const statusStyles: Record<string, { label: string; classes: string }> = {
  PROCESSING: { label: 'Procesando…', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  DONE: { label: 'Completada', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  FAILED: { label: 'Error', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export function AdminTranscribePage() {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoHeight > v.videoWidth) setIsVertical(true);
  };

  const load = async () => {
    try {
      const { data } = await adminApi.transcriptions();
      setList(data.transcriptions);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar transcripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Detener polling al desmontar
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await adminApi.transcriptionStatus(id);
        const t = data.transcription;
        setActive(t);
        if (t.status === 'DONE' || t.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          await load();
        }
      } catch { /* ignorar */ }
    }, 4000);
  };

  const handleTranscribe = async () => {
    const trimmed = url.trim();
    if (!/facebook\.com|fb\.watch|fb\.com/.test(trimmed)) {
      toast.error('Pega un link de Facebook');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await adminApi.transcribe(trimmed);
      const id = data.transcription.id;
      const pending = { id, url: trimmed, status: 'PROCESSING', title: null, text: null, createdAt: new Date().toISOString() };
      setActive(pending);
      setList(prev => [pending, ...prev]);
      setUrl('');
      toast.success('Procesando el video… puede tardar unos segundos.');
      startPolling(id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo iniciar la transcripción');
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = async () => {
    if (!active?.text) return;
    try {
      await navigator.clipboard.writeText(active.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const downloadText = () => {
    if (!active?.text) return;
    const safeTitle = (active.title || 'transcripcion').replace(/[^\w\d-]+/g, '_').slice(0, 40);
    const blob = new Blob([`Video: ${active.url}\n\n${active.text}`], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeTitle}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyVideoPath = async () => {
    if (!active?.videoPath) return;
    try {
      await navigator.clipboard.writeText(active.videoPath);
      toast.success('URL de video local copiada');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const openActive = (t: any) => {
    setActive(t);
    if (t.status === 'PROCESSING') startPolling(t.id);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <PageHeader title="Transcribir video" subtitle="Link de Facebook → texto (sin guardar el video en el servidor)" icon={FileText} />

      {/* Formulario */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6">
        <Label htmlFor="fb-url">Link del video de Facebook</Label>
        <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
          <Input
            id="fb-url"
            placeholder="https://www.facebook.com/.../videos/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1"
          />
          <ButtonPrimary onClick={handleTranscribe} disabled={submitting || !url.trim()} className="shrink-0">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Proceder
          </ButtonPrimary>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-400 mt-2 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Solo videos públicos · el audio se procesa en memoria, no se guarda en el servidor.
        </p>
      </div>

      {/* Resultado activo */}
      {active && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-dark-100 truncate">
                {active.title || 'Video de Facebook'}
              </p>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline truncate max-w-full mt-0.5"
              >
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{active.url}</span>
              </a>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[active.status]?.classes || 'bg-gray-100 text-gray-600'}`}>
                  {statusStyles[active.status]?.label || active.status}
                </span>
                {active.durationSec ? <span className="text-[11px] text-gray-400">{Math.round(active.durationSec / 60)} min</span> : null}
                {active.status === 'PROCESSING' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
              </div>
            </div>
            {(active.status === 'DONE' || active.status === 'FAILED') && pollRef.current && (
              <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); }} className="text-xs text-gray-400 hover:text-gray-600">
                Detener
              </button>
            )}
          </div>
          <div className="p-5">
            {active.status === 'PROCESSING' && (
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-400">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                Descargando y transcribiendo el video…
              </div>
            )}
            {active.status === 'FAILED' && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {active.error || 'Error al transcribir'}
              </div>
            )}
            {active.status === 'DONE' && (
              <div className="space-y-3">
                {active.videoPath && (
                  <div className={`relative bg-black rounded-xl overflow-hidden ${isVertical ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-video'}`}>
                    <video
                      src={active.videoPath}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                      onLoadedMetadata={handleVideoMetadata}
                    />
                  </div>
                )}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-700/50 border border-gray-100 dark:border-dark-600 whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-dark-100 max-h-96 overflow-y-auto">
                  {active.text}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={copyText} className="border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar texto'}
                  </Button>
                  <Button onClick={downloadText} className="border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200">
                    <Download className="w-4 h-4" />
                    Descargar .txt
                  </Button>
                  {active.videoPath && (
                    <Button onClick={copyVideoPath} className="border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200">
                      <Link2 className="w-4 h-4" />
                      Copiar URL video local
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <History className="w-4 h-4" /> Historial
          </h2>
          <button onClick={load} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 p-1 rounded-lg transition-colors" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400 dark:text-dark-500">
            Aún no hay transcripciones.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {list.map(t => (
              <button
                key={t.id}
                onClick={() => openActive(t)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-300 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">{t.title || t.url}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">{t.url}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-500">{fmtDate(t.createdAt)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${statusStyles[t.status]?.classes || ''}`}>
                  {statusStyles[t.status]?.label || t.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
