import { useEffect, useState } from 'react';
import { FolderOpen, Image as ImageIcon, Film, Download, Loader2, X, Package } from 'lucide-react';
import { tiktokApi } from '@/services/api';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';

export function ContentMaterialsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    tiktokApi.material()
      .then(r => setData(r.data))
      .catch((e: any) => toast.error(e.response?.data?.error || 'Error al cargar el material'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  const categories = data?.categories || [];
  const total = categories.reduce((s: number, c: any) => s + c.products.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Contenido de productos" subtitle="Imágenes y videos listos para usar y descargar" icon={FolderOpen} />

      {total === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-dark-500">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aún no hay material disponible.</p>
        </div>
      ) : categories.map((cat: any) => (
        <div key={cat.id} className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary-600" /> {cat.name}
            <span className="text-xs font-normal text-gray-400">({cat.products.length})</span>
          </h2>
          <div className="space-y-4">
            {cat.products.map((p: any) => {
              const images = p.media.filter((m: any) => m.type === 'IMAGE');
              const videos = p.media.filter((m: any) => m.type === 'VIDEO');
              return (
                <div key={p.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-700 flex items-center justify-center shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-dark-100">{p.name}</h3>
                  </div>

                  {images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Imágenes</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {images.map((m: any) => (
                          <div key={m.id} className="relative group rounded-xl overflow-hidden border border-gray-100 dark:border-dark-700">
                            <button type="button" onClick={() => setPreview(m.url)} className="block w-full">
                              <img src={m.url} alt={m.title || p.name} className="w-full h-28 object-cover" />
                            </button>
                            <a href={m.url} download target="_blank" rel="noopener noreferrer" className="absolute bottom-1 right-1 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100">
                              <Download className="w-3 h-3" /> Descargar
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {videos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 mb-2 flex items-center gap-1"><Film className="w-3.5 h-3.5" /> Videos</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {videos.map((m: any) => (
                          <div key={m.id} className="rounded-xl overflow-hidden border border-gray-100 dark:border-dark-700 bg-black">
                            <video src={m.url} controls preload="metadata" className="w-full h-44 object-contain bg-black" />
                            <a href={m.url} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-dark-800 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700">
                              <Download className="w-3.5 h-3.5" /> Descargar video
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="w-5 h-5" /></button>
          <img src={preview} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <a href={preview} download className="absolute bottom-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 text-sm font-semibold" onClick={e => e.stopPropagation()}><Download className="w-4 h-4" /> Descargar</a>
        </div>
      )}
    </div>
  );
}
