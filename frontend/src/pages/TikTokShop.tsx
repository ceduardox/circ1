import { useEffect, useRef, useState } from 'react';
import { Music, Play, ExternalLink, Loader2, CheckCircle2, AlertCircle, Plus, Clock, RefreshCw, ShoppingBag, TrendingUp, Wallet, Sparkles, Search, Users } from 'lucide-react';
import { tiktokApi } from '@/services/api';
import { ButtonPrimary, Button, Input, Label, PageHeader } from '@/components/ui';
import { TikTokIcon, TikTokShopIcon } from '@/components/TikTokLogo';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const creatorStatusMeta: Record<string, { label: string; classes: string }> = {
  PENDIENTE: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  ACEPTADO: { label: 'Aceptado', classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  ACTIVO: { label: 'Activo', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

const loadingPhrases = [
  'Buscando creadores de contenido...',
  'Conectando con afiliados de TikTok Shop...',
  'Preparando tu equipo de creadores...',
];

export function TikTokShopPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pendingPay, setPendingPay] = useState<any>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % loadingPhrases.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (data?.campaign) {
      pollRef.current = setInterval(() => {
        load(true);
      }, 60000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [data?.campaign?.id]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await tiktokApi.my();
      setData(res.data);
    } catch (e: any) {
      if (!silent) toast.error(e.response?.data?.error || 'Error al cargar TikTok Shop');
    } finally {
      setLoading(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    try {
      await tiktokApi.activate();
      toast.success('TikTok Shop activado. Buscando creadores...');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al activar');
    } finally {
      setActivating(false);
    }
  };

  const buyExtra = async () => {
    const win = window.open('', '_blank');
    setBuying(true);
    try {
      const { data: res } = await tiktokApi.extraPaymentRequest();
      setPendingPay({ id: res.payment.id, invoiceUrl: res.invoiceUrl, amount: res.price });
      if (res.invoiceUrl) {
        if (win) win.location.href = res.invoiceUrl;
      } else if (win && win.location.href === 'about:blank') {
        win.close();
      }
      startPolling(res.payment.id);
    } catch (e: any) {
      if (win && win.location.href === 'about:blank') win.close();
      toast.error(e.response?.data?.error || 'No se pudo iniciar el pago');
    } finally {
      setBuying(false);
    }
  };

  const startPolling = (paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data: res } = await tiktokApi.extraPaymentStatus(paymentId);
        const p = res.payment;
        if (p?.status === 'APPROVED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPendingPay(null);
          toast.success('¡Pago confirmado! Tienes un espacio más para un creador.');
          await load();
        }
      } catch { /* temporal */ }
    }, 5000);
  };

  useEffect(() => {
    tiktokApi.extraPaymentPending().then(res => {
      const p = res.data.payment;
      if (p) {
        setPendingPay({ id: p.id, invoiceUrl: p.invoiceUrl, amount: p.amount, remainingMin: p.remainingMin });
        startPolling(p.id);
      }
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ─── Estado 1: sin activar (landing) ───
  if (!data.campaign) {
    return <Landing data={data} activating={activating} onActivate={activate} />;
  }

  const max = data.maxCreators;
  const assigned = data.creators.length;
  const emptySlots = Math.max(max - assigned, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="TikTok Shop"
        subtitle="Tus creadores de contenido y tus ganancias por ventas"
        icon={Music}
      />

      {/* Banner membresía no al día */}
      {data.memberStatus !== 'ACTIVE' && data.memberStatus !== 'GRACE' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold">Tu membresía no está al día</p>
            <p className="text-xs mt-1">
              Tus comisiones pendientes serán acreditadas al admin hasta que renueves tu membresía.
              {' '}<Link to="/earnings" className="underline font-medium">Renovarla</Link>
            </p>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} color="text-emerald-600" bg="bg-emerald-50" label="Ganado disponible" value={fmt(data.summary?.totalApproved ?? 0)} />
        <StatCard icon={Clock} color="text-amber-600" bg="bg-amber-50" label="Pendiente por aprobar" value={fmt(data.summary?.totalPending ?? 0)} />
        <StatCard icon={ShoppingBag} color="text-primary-600" bg="bg-primary-50" label="Ventas registradas" value={String(data.summary?.totalSales ?? 0)} />
        <StatCard icon={Users} color="text-purple-600" bg="bg-purple-50" label="Creadores" value={`${assigned} / ${max}`} />
      </div>

      {/* Creadores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" /> Tus creadores de contenido
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
              {data.campaign.packType === 1000 ? 'Pack Élite (10 creadores)' : 'Pack Estándar (5 creadores)'}
              {data.campaign.extraCreators > 0 && <> · +{data.campaign.extraCreators} extra pagados</>}
            </p>
          </div>
          {max > 0 && (
            <button
              onClick={buyExtra}
              disabled={buying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar creador ({fmt(data.extraCreatorPrice)})
            </button>
          )}
        </div>

        {/* Grid de cards de creadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.creators.map((c: any) => (
            <div key={c.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-base font-bold shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">{c.name}</p>
                  {c.tiktokUrl ? (
                    <a href={c.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline truncate">
                      <TikTokIcon className="w-3 h-3" /> Ver cuenta <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400">Sin link aún</p>
                  )}
                </div>
              </div>
              <span className={clsx('self-start text-[11px] font-semibold px-2.5 py-1 rounded-full', creatorStatusMeta[c.status].classes)}>
                {creatorStatusMeta[c.status].label}
              </span>
            </div>
          ))}

          {/* Slots vacíos: buscando creadores */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600 p-4 flex flex-col items-center justify-center gap-3 min-h-[110px] bg-gray-50/50 dark:bg-dark-700/20 animate-pulse-soft">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-600 dark:to-dark-500 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400 dark:text-dark-400" />
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-dark-500 text-center">
                Buscando creadores de contenido...
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de pago pendiente */}
      {pendingPay && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-dark-100">Pago de creador extra</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-300 mb-4">
              Completa tu pago de <span className="font-bold">{fmt(pendingPay.amount ?? data.extraCreatorPrice)}</span> para agregar un espacio más de creador.
              {pendingPay.remainingMin != null && pendingPay.remainingMin > 0 && (
                <span className="text-gray-400 text-xs block mt-1">Tienes {pendingPay.remainingMin} min para completarlo.</span>
              )}
            </p>
            <div className="flex gap-2">
              {pendingPay.invoiceUrl && (
                <ButtonPrimary className="flex-1" onClick={() => window.open(pendingPay.invoiceUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4" /> Abrir página de pago
                </ButtonPrimary>
              )}
              <Button onClick={() => setPendingPay(null)} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
                Cerrar
              </Button>
            </div>
            <button
              onClick={() => pendingPay.id && startPolling(pendingPay.id)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 text-xs text-primary-600 dark:text-primary-400 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Verificar estado del pago
            </button>
          </div>
        </div>
      )}

      {/* Historial de ventas / ganancias */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Historial de ganancias
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
            Cada vez que un creador tuyo vende un producto, ganas {data.products?.[0]?.commissionRate ?? 25}% de la venta.
          </p>
        </div>
        {data.sales.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
            Aún no hay ventas. Cuando tus creadores empiecen a vender, verás aquí tus ganancias.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {data.sales.map((s: any) => {
              const mine = s.commissions?.find((c: any) => c.type === 'STUDENT');
              return (
                <div key={s.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {s.product?.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                      {s.product?.name} × {s.quantity}
                      <span className="text-gray-400 font-normal"> · {s.creator?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {new Date(s.saleDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · Ventas totales: '}{fmt(s.unitPrice * s.quantity)}
                    </p>
                  </div>
                  {mine && (
                    <div className="text-right shrink-0">
                      <p className={clsx('text-sm font-bold',
                        mine.status === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        +{fmt(mine.amount)}
                      </p>
                      <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        mine.status === 'APPROVED'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                        {mine.status === 'APPROVED' ? 'Disponible' : 'Pendiente'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Landing cuando aún no se activa ───
function Landing({ data, activating, onActivate }: { data: any; activating: boolean; onActivate: () => void }) {
  const steps = [
    { icon: <Search className="w-5 h-5" />, title: 'Buscamos creadores por ti', desc: 'Activamos tu equipo de afiliados de TikTok Shop y les enviamos muestras y guiones.' },
    { icon: <Play className="w-5 h-5" />, title: 'Ellos hacen los videos', desc: 'Los creadores graban contenido promocionando los productos con su cuenta de TikTok.' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Cobras comisiones', desc: `Ganas ${data.products?.[0]?.commissionRate ?? 25}% por cada venta que genere tu creador. Se acredita a tu balance.` },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 sm:p-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <TikTokShopIcon className="w-10 h-10 text-pink-500" />
            <div>
              <p className="font-black text-xl">TikTok Shop</p>
              <p className="text-xs text-gray-400">Programa de afiliados con creadores de contenido</p>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            Vende a través de creadores de TikTok <span className="text-pink-500">sin grabar ni un video.</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mt-3 max-w-xl">
            Te asignamos afiliados de TikTok Shop que promocionan los productos. Por cada venta que ellos generen,
            tú cobras una comisión. Sin LLC, sin ITIN.
          </p>

          {/* Paquete del usuario */}
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-semibold">
                Tu plan te incluye{' '}
                <span className="text-amber-300 font-black">
                  {data.campaign ? data.campaign.baseCreators : ''}
                </span>{' '}
                {data.campaign?.baseCreators === 10 ? 'creadores' : 'creadores'} de contenido
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Pack de {data.campaign?.baseCreators === 10 ? '$1,000' : '$500'}: {data.campaign?.baseCreators === 10 ? '10' : '5'} creadores · Agrega más por {fmt(data.extraCreatorPrice)} c/u.
            </p>
          </div>

          <ButtonPrimary
            onClick={onActivate}
            disabled={activating}
            className="mt-6 px-8 py-3.5 text-base font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-pink-600/30"
          >
            {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {activating ? 'ACTIVANDO...' : 'ACTIVAR TIKTOK SHOP'}
          </ButtonPrimary>
        </div>
      </div>

      {/* Cómo funciona */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-4">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center mb-3">
                {s.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                <span className="text-pink-500 font-black">{i + 1}.</span> {s.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Relación con VIP Pro */}
      <div className="bg-gradient-to-br from-purple-700 to-fuchsia-700 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-bold text-lg">¿Quieres aprender el proceso completo?</p>
          <p className="text-sm text-purple-100 mt-1">
            En el módulo VIP Pro te enseñamos cómo funciona TikTok Shop, los afiliados y cómo cobrar sin LLC.
          </p>
        </div>
        <Link to="/vip-pro" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors shrink-0">
          <CheckCircle2 className="w-4 h-4" /> Ver módulo VIP Pro
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, bg, label, value }: { icon: any; color: string; bg: string; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-dark-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-dark-100 truncate">{value}</p>
      </div>
    </div>
  );
}
