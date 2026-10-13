import { useEffect, useRef, useState } from 'react';
import { Video, Upload, Loader2, X, CheckCircle2, Download, AlertCircle, Package, Trash2 } from 'lucide-react';
import { tiktokApi } from '@/services/api';
import { ButtonPrimary, PageHeader } from '@/components/ui';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const statusMeta: Record<string, { label: string; classes: string }> = {
  SOLICITADO: { label: 'Solicitado', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  EN_PROCESO: { label: 'En proceso', classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  ENTREGADO: { label: 'Entregado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  CANCELADO: { label: 'Cancelado', classes: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400' },
};

export function MyVideoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const { data } = await tiktokApi.customVideo();
      setData(data);
      const editable = (data.requests || []).find((r: any) => !r.locked && r.status !== 'CANCELADO');
      if (editable) {
        setPhotos(Array.isArray(editable.photos) ? editable.photos : []);
        setSelected((editable.items || []).map((i: any) => i.productId));
      } else {
        setPhotos([]);
        setSelected([]);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const optimize = async (file: File): Promise<File | null> => {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return null; }
    if (file.size > 8 * 1024 * 1024) { toast.error('La imagen no puede superar 8MB'); return null; }
    try {
      const bmp = await createImageBitmap(file);
      const MAX = 1600;
      let { width, height } = bmp;
      if (width > MAX || height > MAX) { const r = Math.min(MAX / width, MAX / height); width = Math.round(width * r); height = Math.round(height * r); }
      const c = document.createElement('canvas'); c.width = width; c.height = height;
      const ctx = c.getContext('2d');
      if (!ctx) { bmp.close(); return file; }
      ctx.drawImage(bmp, 0, 0, width, height); bmp.close();
      const blob = await new Promise<Blob | null>(res => c.toBlob(b => res(b), 'image/jpeg', 0.85));
      if (!blob) return file;
      return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    } catch { return file; }
  };

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    const room = 3 - photos.length;
    if (room <= 0) { toast.error('Máximo 3 fotos'); return; }
    setUploading(true);
    try {
      const added: string[] = [];
      for (const f of files.slice(0, room)) {
        const opt = await optimize(f);
        if (!opt) continue;
        const { data: res } = await tiktokApi.uploadCustomVideoPhoto(opt);
        added.push(res.url);
      }
      setPhotos(p => [...p, ...added]);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 2 ? prev : [...prev, id]));
  };

  const submit = async () => {
    if (photos.length === 0) { toast.error('Sube al menos 1 foto'); return; }
    if (selected.length !== 2) { toast.error('Selecciona exactamente 2 productos'); return; }
    setSubmitting(true);
    try {
      const editable = (data.requests || []).find((r: any) => !r.locked && r.status !== 'CANCELADO');
      if (editable) {
        await tiktokApi.updateCustomVideo(editable.id, { photos, productIds: selected });
        toast.success('Solicitud actualizada');
      } else {
        await tiktokApi.createCustomVideo({ photos, productIds: selected });
        toast.success('Solicitud enviada. Pronto haremos tu video.');
      }
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm('¿Cancelar la solicitud?')) return;
    try {
      await tiktokApi.cancelCustomVideo(id);
      toast.success('Solicitud cancelada');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cancelar');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  const requests = data?.requests || [];
  const activeReq = requests.find((r: any) => r.status !== 'CANCELADO');
  const editableReq = requests.find((r: any) => !r.locked && r.status !== 'CANCELADO');
  const locked = !!activeReq?.locked;
  const products = data?.products || [];
  const showForm = data?.isActive && (!activeReq || !!editableReq);

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Video" subtitle="Pide tus videos personalizados de 2 productos" icon={Video} />

      {!data?.isActive && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>Necesitas una <b>membresía activa</b> para pedir tu video personalizado.</div>
        </div>
      )}

      {activeReq && (() => {
        const st = statusMeta[activeReq.status] || statusMeta.SOLICITADO;
        return (
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2"><Video className="w-4 h-4 text-primary-600" /> Tu solicitud</h2>
              <span className={clsx('text-[11px] font-semibold px-2.5 py-1 rounded-full', st.classes)}>{st.label}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {(activeReq.photos || []).map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-dark-700" />
              ))}
              {(activeReq.items || []).map((it: any) => (
                <div key={it.id} className="flex items-center gap-2 px-2 py-1 rounded-xl bg-gray-50 dark:bg-dark-700">
                  {it.product?.imageUrl ? <img src={it.product.imageUrl} className="w-6 h-6 rounded object-cover" alt="" /> : <Package className="w-4 h-4 text-gray-400" />}
                  <span className="text-xs font-medium text-gray-700 dark:text-dark-200">{it.product?.name}</span>
                </div>
              ))}
            </div>

            {(activeReq.items || []).some((it: any) => it.videoUrl) && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Tus videos personalizados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activeReq.items || []).filter((it: any) => it.videoUrl).map((it: any) => (
                    <div key={it.id} className="rounded-xl overflow-hidden border border-gray-100 dark:border-dark-700 bg-black">
                      <video src={it.videoUrl} controls preload="metadata" className="w-full h-48 object-contain bg-black" />
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-dark-800">
                        <span className="text-xs font-semibold text-gray-700 dark:text-dark-200 truncate">{it.product?.name}</span>
                        <a href={it.videoUrl} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400"><Download className="w-3.5 h-3.5" /> Descargar</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editableReq && (
              <button onClick={() => cancel(editableReq.id)} className="mt-4 text-xs font-semibold text-red-600 dark:text-red-400 inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Cancelar solicitud
              </button>
            )}
          </div>
        );
      })()}

      {showForm && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-100">Mis fotos (1 a 3)</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Tu foto real o de cualquier personaje. Máx 8MB c/u.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 dark:border-dark-700">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-600 flex items-center justify-center cursor-pointer text-gray-400 hover:border-primary-400 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { const fs = Array.from((e.target as HTMLInputElement).files || []); void handleFiles(fs); (e.target as HTMLInputElement).value = ''; }} />
                </label>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-100">Productos (elige 2)</h3>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {products.map((p: any) => {
                const on = selected.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className={clsx('flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-all', on ? 'border-primary-400 bg-primary-50/60 dark:bg-primary-900/20' : 'border-gray-100 dark:border-dark-700 hover:border-primary-200')}>
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" /> : <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>}
                    <span className="flex-1 min-w-0 text-xs font-medium text-gray-900 dark:text-dark-100 truncate">{p.name}</span>
                    {on && <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />}
                  </button>
                );
              })}
              {products.length === 0 && <p className="text-sm text-gray-400">No hay productos activos.</p>}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{selected.length}/2 seleccionados · 1 video por producto</p>
          </div>

          <ButtonPrimary onClick={submit} disabled={submitting || uploading}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {editableReq ? 'Guardar cambios' : 'Enviar solicitud'}
          </ButtonPrimary>
        </div>
      )}

      {data?.isActive && !locked && !showForm && activeReq == null && !data.canRequest && data.nextAvailableAt && (
        <div className="text-sm text-gray-500 dark:text-dark-400">
          Podrás pedir otro video el {new Date(data.nextAvailableAt).toLocaleDateString('es-ES')}.
        </div>
      )}
    </div>
  );
}
