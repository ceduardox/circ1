import { useEffect, useRef, useState } from 'react';
import { FileSignature, Loader2, CheckCircle2, Clock, Download, X, PenLine, AlertCircle } from 'lucide-react';
import { contractsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ButtonPrimary, Button, PageHeader } from '@/components/ui';
import { ContractText } from '@/components/ui/ContractText';
import { toast } from 'sonner';
import { printContract } from '@/lib/contractPrint';

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current!.toDataURL('image/png'));
  };
  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-600 bg-white touch-none cursor-crosshair"
      />
      <button type="button" onClick={clear} className="mt-1 text-xs text-gray-500 hover:text-red-600">Limpiar</button>
    </div>
  );
}

export function ContractsPage() {
  const user = useAuthStore(s => s.user);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [sigImage, setSigImage] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const load = async () => {
    try {
      const { data } = await contractsApi.my();
      setContracts(data.contracts || []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openContract = (c: any) => {
    setActive(c);
    setName(c.signedName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim());
    setAccepted(false);
    setSigImage(null);
  };

  const sign = async () => {
    if (!active) return;
    if (name.trim().length < 3) { toast.error('Escribe tu nombre completo'); return; }
    if (!sigImage) { toast.error('Dibuja tu firma en el recuadro'); return; }
    if (!accepted) { toast.error('Debes aceptar el contrato'); return; }
    setSigning(true);
    try {
      await contractsApi.sign(active.id, { signedName: name.trim(), signatureImage: sigImage });
      toast.success('Contrato firmado');
      setActive(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al firmar');
    } finally {
      setSigning(false);
    }
  };

  const printContract_pdf = (c: any) => {
    if (!printContract(c)) toast.error('Permite las ventanas emergentes para descargar');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  const pending = contracts.filter(c => c.status === 'PENDIENTE');
  const signed = contracts.filter(c => c.status === 'FIRMADO');

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos" subtitle="Revisa y firma tus contratos" icon={FileSignature} />

      {contracts.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-dark-500">
          <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No tienes contratos por ahora.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Pendientes de firma</h2>
          {pending.map(c => (
            <div key={c.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm p-4 flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0"><PenLine className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{c.contract.title}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400">{new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <ButtonPrimary size="sm" onClick={() => openContract(c)}><PenLine className="w-4 h-4" /> Ver y firmar</ButtonPrimary>
            </div>
          ))}
        </div>
      )}

      {signed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Firmados</h2>
          {signed.map(c => (
            <div key={c.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{c.contract.title}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400">Firmado {c.signedAt ? new Date(c.signedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
              </div>
              <Button size="sm" className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300" onClick={() => openContract(c)}>Ver</Button>
              <Button size="sm" className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300" onClick={() => printContract_pdf(c)}><Download className="w-4 h-4" /> PDF</Button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-3 overflow-y-auto" onClick={() => setActive(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-dark-100">{active.contract.title}</h3>
              <button onClick={() => setActive(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-[45vh] overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Fecha del contrato: {active.contract.createdAt ? new Date(active.contract.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</p>
              <ContractText text={active.contract.body} />
            </div>

            {active.status === 'FIRMADO' ? (
              <div className="p-4 border-t border-gray-100 dark:border-dark-700 space-y-2">
                <p className="text-xs text-gray-500 dark:text-dark-400">Firmado por <b className="text-gray-700 dark:text-dark-200">{active.signedName}</b> el {active.signedAt ? new Date(active.signedAt).toLocaleString('es-ES') : ''}</p>
                {active.signatureImage && <img src={active.signatureImage} alt="firma" className="max-h-24 bg-white rounded-lg border border-gray-200 dark:border-dark-600" />}
                <p className="text-[10px] text-gray-400 break-all">Hash: {active.contentHash}</p>
                <ButtonPrimary size="sm" onClick={() => printContract_pdf(active)}><Download className="w-4 h-4" /> Descargar PDF</ButtonPrimary>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 dark:border-dark-700 space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Al firmar aceptas el contenido de este contrato. Se guardará tu nombre, firma, fecha, IP y el hash del documento.</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800 dark:text-dark-100">Nombre completo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Escribe tu nombre completo"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-800 dark:text-dark-100">Firma</label>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mb-1">Dibuja tu firma con el mouse o el dedo.</p>
                  <SignaturePad onChange={setSigImage} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-200">
                  <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-4 h-4 rounded" />
                  He leído y acepto el contrato
                </label>
                <ButtonPrimary onClick={sign} disabled={signing}>
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />} Firmar contrato
                </ButtonPrimary>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
