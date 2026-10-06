import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Music, Play, ExternalLink, Loader2, CheckCircle2, AlertCircle, Plus,
  Clock, RefreshCw, ShoppingBag, TrendingUp, Wallet, Sparkles, Search,
  Users, X, FolderOpen, Calculator, Download, Eye, HelpCircle, ChevronRight,
  ChevronDown, Sliders, ArrowUpRight, Check, Copy, Share2, DollarSign,
  Film, Image as ImageIcon, FileText, CheckCircle, ShieldCheck, ArrowRight,
  Filter, Sparkle
} from 'lucide-react';
import { tiktokApi } from '@/services/api';
import { ButtonPrimary, Button, PageHeader } from '@/components/ui';
import { TikTokIcon, TikTokShopIcon, TikTokLogo } from '@/components/TikTokLogo';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const creatorStatusMeta: Record<string, { label: string; classes: string; dot: string }> = {
  ACTIVO: {
    label: 'Activo',
    classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500 animate-pulse',
  },
  ACEPTADO: {
    label: 'Aceptado',
    classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50',
    dot: 'bg-blue-500',
  },
  PENDIENTE: {
    label: 'Pendiente',
    classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
  },
};

const loadingPhrases = [
  'Buscando creadores de contenido calificados...',
  'Conectando con afiliados activos de TikTok Shop...',
  'Preparando tu equipo de creadores y muestras de producto...',
  'Configurando catálogo y enlaces de comisión...',
];

// Resaltado de coincidencias estilo WhatsApp
function highlightMatch(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function TikTokShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'creators';

  const [data, setData] = useState<any>(null);
  const [materialData, setMaterialData] = useState<any>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pendingPay, setPendingPay] = useState<any>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [savingSlots, setSavingSlots] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ type: string; url: string; title?: string } | null>(null);

  // Filtros de creadores
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<'ALL' | 'ACTIVO' | 'ACEPTADO' | 'PENDIENTE' | 'EMPTY'>('ALL');

  // Filtros de materiales
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'VIDEO' | 'IMAGE'>('ALL');

  // Filtros de ventas
  const [salesSearch, setSalesSearch] = useState('');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  // Calculadora interactiva
  const [calcCreators, setCalcCreators] = useState<number>(5);
  const [calcSalesPerCreator, setCalcSalesPerCreator] = useState<number>(15);
  const [calcAvgPrice, setCalcAvgPrice] = useState<number>(35);
  const [calcCommissionRate, setCalcCommissionRate] = useState<number>(25);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUser = useAuthStore(s => s.user);

  // Ocultar el link "Ver cuenta" del creador solo para esta cuenta especial
  const hideCreatorLink = currentUser?.username?.toLowerCase() === 'celis';

  useEffect(() => {
    load();
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

  // Cargar material multimedia si se abre el tab de material
  useEffect(() => {
    if (currentTab === 'material' && !materialData && !loadingMaterial) {
      loadMaterial();
    }
  }, [currentTab]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await tiktokApi.my();
      setData(res.data);
      if (res.data?.campaign?.baseCreators) {
        setCalcCreators(res.data.maxCreators || res.data.campaign.baseCreators || 5);
      }
    } catch (e: any) {
      if (!silent) toast.error(e.response?.data?.error || 'Error al cargar TikTok Shop');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterial = async () => {
    setLoadingMaterial(true);
    try {
      const res = await tiktokApi.material();
      setMaterialData(res.data);
    } catch (e: any) {
      toast.error('No se pudieron cargar los materiales');
    } finally {
      setLoadingMaterial(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    try {
      await tiktokApi.activate();
      toast.success('TikTok Shop activado con éxito. Buscando creadores...');
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

  // Inicializa la rejilla de productos guardada
  useEffect(() => {
    if (!data?.campaign) { setSlots([]); return; }
    const maxSlots = data.maxCreators ?? 0;
    const saved: string[] = Array.isArray(data.campaign.productSlots) ? data.campaign.productSlots : [];
    setSlots(Array.from({ length: maxSlots }, (_, i) => saved[i] || ''));
  }, [data?.campaign?.id, data?.maxCreators, JSON.stringify(data?.campaign?.productSlots ?? [])]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-pink-500/20 border-t-pink-500 animate-spin" />
          <TikTokIcon className="w-5 h-5 absolute inset-0 m-auto text-pink-500 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-dark-400">Cargando TikTok Shop Studio...</p>
      </div>
    );
  }

  // ─── Estado: Sin activar (Landing interactiva de presentación) ───
  if (!data?.campaign) {
    return <LandingView data={data} activating={activating} onActivate={activate} />;
  }

  const max = data.maxCreators || 0;
  const assigned = data.creators?.length || 0;
  const emptySlots = Math.max(max - assigned, 0);

  const productById: Record<string, any> = {};
  for (const p of (data.products || [])) productById[p.id] = p;
  const usedSlots = slots.filter(Boolean).length;
  const savedSlots: string[] = Array.isArray(data.campaign.productSlots) ? data.campaign.productSlots : [];
  const slotsDirty = JSON.stringify(slots.filter(Boolean)) !== JSON.stringify(savedSlots.filter(Boolean));

  const saveSlots = async () => {
    setSavingSlots(true);
    try {
      await tiktokApi.updateProductPlan(slots.filter(Boolean));
      toast.success('Plan de productos actualizado con éxito');
      await load(true);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar');
    } finally {
      setSavingSlots(false);
    }
  };

  // Filtrado de creadores
  const filteredCreators = (data.creators || []).filter((c: any) => {
    const matchesSearch = creatorSearch.trim() === '' ||
      c.name?.toLowerCase().includes(creatorSearch.toLowerCase()) ||
      c.tiktokUrl?.toLowerCase().includes(creatorSearch.toLowerCase());

    const matchesStatus = creatorFilter === 'ALL' || c.status === creatorFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtrado de ventas
  const filteredSales = (data.sales || []).filter((s: any) => {
    const matchesSearch = salesSearch.trim() === '' ||
      s.product?.name?.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.creator?.name?.toLowerCase().includes(salesSearch.toLowerCase());

    const mine = s.commissions?.find((c: any) => c.type === 'STUDENT');
    const matchesStatus = salesFilter === 'ALL' || (mine && mine.status === salesFilter);
    return matchesSearch && matchesStatus;
  });

  const filteredPickerProducts = (data.products || []).filter((p: any) => {
    if (!pickerSearch.trim()) return true;
    return p.name?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      String(p.price).includes(pickerSearch);
  });

  // Cálculo de proyecciones
  const calcTotalMonthlyVolume = calcCreators * calcSalesPerCreator * calcAvgPrice;
  const calcTotalMonthlyCommission = calcTotalMonthlyVolume * (calcCommissionRate / 100);
  const calcDailyCommission = calcTotalMonthlyCommission / 30;
  const calcAnnualCommission = calcTotalMonthlyCommission * 12;

  const tabs = [
    { id: 'creators', label: 'Creadores', icon: Users, count: `${assigned}/${max}`, color: 'from-pink-500 to-rose-600' },
    { id: 'products', label: 'Catálogo & Slots', icon: ShoppingBag, count: `${usedSlots}/${max}`, color: 'from-purple-500 to-indigo-600' },
    { id: 'sales', label: 'Ventas & Ganancias', icon: TrendingUp, count: String(data.summary?.totalSales || 0), color: 'from-emerald-500 to-teal-600' },
    { id: 'material', label: 'Material Creativo', icon: FolderOpen, count: 'Recursos', color: 'from-amber-500 to-orange-600' },
    { id: 'calculator', label: 'Calculadora', icon: Calculator, count: 'Simulador', color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="TikTok Shop Affiliate Studio"
        subtitle="Monitorea tus creadores de contenido, productos estratégicos y comisiones generadas en automático."
        icon={Music}
      />

      {/* Alerta de Período de Gracia */}
      {data.memberStatus === 'GRACE' && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent dark:from-amber-500/20 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3.5 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Membresía en período de gracia</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                Acción Requerida
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
              Tus creadores siguen activos y generando ventas, pero si vence tu gracia perderás la acreditación directa de comisiones.
            </p>
          </div>
          <Link
            to="/program"
            className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/30"
          >
            Renovar ahora
          </Link>
        </div>
      )}

      {/* Alerta de Membresía Inactiva / Vencida */}
      {data.memberStatus !== 'ACTIVE' && data.memberStatus !== 'GRACE' && data.memberStatus && (
        <div className="p-4 bg-gradient-to-r from-red-500/15 via-red-500/10 to-transparent dark:from-red-500/20 border border-red-300 dark:border-red-800 rounded-2xl flex items-start gap-3.5 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-red-900 dark:text-red-200">Comisiones pausadas por membresía inactiva</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200">
                Pausado
              </span>
            </div>
            <p className="text-xs text-red-800/90 dark:text-red-300/90 mt-1 leading-relaxed">
              Activa tu plan para desbloquear y recibir el pago íntegro de las comisiones generadas por tu equipo de creadores.
            </p>
          </div>
          <Link
            to="/program"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm shadow-red-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" /> Activar Plan
          </Link>
        </div>
      )}

      {/* Hero Card Visual Estilo Cyberpunk / TikTok Pro */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-5 sm:p-7 border border-white/10 shadow-xl">
        {/* Luces de Neón TikTok Ambientales */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
                <TikTokShopIcon className="w-4 h-4 text-pink-400" />
                <span>TikTok Shop Afiliados</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300">
                {data.campaign?.packType === 1000 ? 'Pack Élite (10 creadores base)' : 'Pack Estándar (5 creadores base)'}
              </span>
              {data.campaign?.extraCreators > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                  +{data.campaign.extraCreators} extra
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Tu equipo de creadores vendiendo en <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">TikTok en automático</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Los afiliados asignados reciben muestras, graban videos virales con tus productos y tú cobras el <strong>{data.products?.[0]?.commissionRate ?? 25}%</strong> de cada venta registrada.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            {max > 0 && (
              <button
                onClick={buyExtra}
                disabled={buying}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-bold shadow-lg shadow-pink-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Agregar creador extra ({fmt(data.extraCreatorPrice)})</span>
              </button>
            )}

            <button
              onClick={() => load(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar datos</span>
            </button>
          </div>
        </div>

        {/* 4 Métricas Clave en el Hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Ganancia Disponible</p>
            <p className="text-base sm:text-xl font-black text-emerald-400 mt-0.5 truncate">{fmt(data.summary?.totalApproved ?? 0)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Comisión Pendiente</p>
            <p className="text-base sm:text-xl font-black text-amber-400 mt-0.5 truncate">{fmt(data.summary?.totalPending ?? 0)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Ventas Totales</p>
            <p className="text-base sm:text-xl font-black text-white mt-0.5">{data.summary?.totalSales ?? 0} u.</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Creadores Activos</p>
            <p className="text-base sm:text-xl font-black text-pink-400 mt-0.5">{assigned} / {max}</p>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation (Touch Scrollable) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-gray-50/90 dark:bg-dark-900/90 backdrop-blur-md border-y border-gray-200/60 dark:border-dark-700/60">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  active
                    ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-md shadow-black/5 ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-dark-800/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${tab.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
                    : 'bg-gray-200/80 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: Creadores de Contenido ─── */}
      {currentTab === 'creators' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header del Tab & Buscador */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  <span>Creadores Asignados a tu Cuenta</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  {assigned} de {max} creadores asignados ({emptySlots} en proceso de búsqueda por nuestro equipo)
                </p>
              </div>

              {max > 0 && (
                <button
                  onClick={buyExtra}
                  disabled={buying}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-dark-700 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Creador ({fmt(data.extraCreatorPrice)})</span>
                </button>
              )}
            </div>

            {/* Buscador y Filtros estilo WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar creador por nombre o enlace de TikTok..."
                  value={creatorSearch}
                  onChange={e => setCreatorSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500"
                />
                {creatorSearch && (
                  <button
                    onClick={() => setCreatorSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {[
                  { id: 'ALL', label: 'Todos', count: data.creators?.length || 0 },
                  { id: 'ACTIVO', label: 'Activos', count: data.creators?.filter((c: any) => c.status === 'ACTIVO').length || 0 },
                  { id: 'ACEPTADO', label: 'Aceptados', count: data.creators?.filter((c: any) => c.status === 'ACEPTADO').length || 0 },
                  { id: 'PENDIENTE', label: 'Pendientes', count: data.creators?.filter((c: any) => c.status === 'PENDIENTE').length || 0 },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setCreatorFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      creatorFilter === chip.id
                        ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 ring-1 ring-pink-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Cards de Creadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCreators.map((c: any) => {
              const meta = creatorStatusMeta[c.status] || creatorStatusMeta.PENDIENTE;
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-4 hover:shadow-md hover:border-pink-200 dark:hover:border-pink-900/40 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                        {highlightMatch(c.name || 'Creador Sin Nombre', creatorSearch)}
                      </p>
                      {!hideCreatorLink && c.tiktokUrl ? (
                        <a
                          href={c.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1 hover:underline mt-0.5 truncate font-medium"
                        >
                          <TikTokIcon className="w-3 h-3 text-pink-500 shrink-0" />
                          <span className="truncate">Ver perfil en TikTok</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                        </a>
                      ) : (
                        <p className="text-[11px] text-gray-400 dark:text-dark-500 mt-0.5">
                          {c.tiktokUrl ? 'Perfil asignado y verificado' : 'Enlace en proceso'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-700/60">
                    <span className={clsx('inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full', meta.classes)}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>

                    <span className="text-[11px] text-gray-400 dark:text-dark-500 font-medium">
                      Afiliado Activo
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Espacios Vacíos: Proceso de Scouting */}
            {creatorFilter === 'ALL' && Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-dark-700 p-5 flex flex-col items-center justify-center text-center gap-3 bg-gray-50/50 dark:bg-dark-800/30 min-h-[160px] relative overflow-hidden group"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center text-gray-500 dark:text-dark-400">
                    <Search className="w-5 h-5 text-gray-400 dark:text-dark-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-dark-300">
                    Buscando creador calificado...
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-dark-500 mt-0.5 max-w-[200px]">
                    Espacio #{assigned + i + 1} en proceso de asignación con muestras de producto.
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredCreators.length === 0 && emptySlots === 0 && (
            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700">
              <Search className="w-8 h-8 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-dark-300">No se encontraron creadores</p>
              <p className="text-xs text-gray-400 mt-1">Prueba con otro término de búsqueda o limpia los filtros.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Catálogo & Mis Slots ─── */}
      {currentTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header de Configuración de Slots */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                  <span>Productos que deseas que ofrezcan tus Creadores</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 max-w-2xl leading-relaxed">
                  Rellena tus <strong>{max} espacios disponibles</strong> con los productos del catálogo. Esta selección le indica a los creadores y al equipo qué productos priorizar en sus guiones y videos virales.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
                  {usedSlots} de {max} seleccionados
                </div>

                {slotsDirty && (
                  <button
                    onClick={saveSlots}
                    disabled={savingSlots}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
                  >
                    {savingSlots ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Guardar Cambios</span>
                  </button>
                )}
              </div>
            </div>

            {/* Rejilla de Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
              {slots.map((pid, i) => {
                const prod = pid ? productById[pid] : null;
                return (
                  <div
                    key={i}
                    className={`relative rounded-2xl border-2 p-3.5 flex flex-col items-center justify-between gap-2.5 min-h-[145px] transition-all ${
                      prod
                        ? 'border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-900/15 shadow-xs'
                        : 'border-dashed border-gray-200 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-800/30 hover:border-purple-400 dark:hover:border-purple-600'
                    }`}
                  >
                    {prod ? (
                      <>
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-dark-700 shadow-xs shrink-0 flex items-center justify-center">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-purple-500" />
                          )}
                        </div>

                        <div className="text-center w-full min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-dark-100 truncate">{prod.name}</p>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{fmt(prod.price)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPickerSlot(i)}
                          className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Cambiar
                        </button>

                        <button
                          type="button"
                          onClick={() => setSlots(prev => prev.map((x, j) => (j === i ? '' : x)))}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white dark:bg-dark-700 text-gray-400 hover:text-red-600 flex items-center justify-center shadow-xs transition-colors"
                          title="Quitar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerSlot(i)}
                        className="flex flex-col items-center justify-center gap-2 w-full h-full py-3"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-dark-500 flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500 transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-dark-400">Espacio #{i + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Catálogo Completo Visual */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Catálogo de Productos Disponibles</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Productos físicos de alta demanda listos para venta y entrega en TikTok Shop
                </p>
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-dark-500">
                {data.products?.length || 0} productos activos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data.products || []).map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-100 dark:border-dark-700 p-4 bg-gray-50/50 dark:bg-dark-900/40 flex flex-col gap-3 group hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                >
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-white dark:bg-dark-800 flex items-center justify-center relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                      {fmt(p.price)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-dark-100 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-gray-500 dark:text-dark-400 line-clamp-2 mt-1">{p.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-dark-700/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-dark-400">Comisión estimada:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      +{fmt(p.price * ((p.commissionRate ?? 25) / 100))} ({p.commissionRate ?? 25}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Ventas & Ganancias ─── */}
      {currentTab === 'sales' && (
        <div className="space-y-5 animate-fade-in">
          {/* Métricas Financieras */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              icon={Wallet}
              color="text-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-950/30"
              label="Disponible para Retiro"
              value={fmt(data.summary?.totalApproved ?? 0)}
              subtext="Saldo aprobado por entregas"
            />
            <StatCard
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-50 dark:bg-amber-950/30"
              label="Comisiones Pendientes"
              value={fmt(data.summary?.totalPending ?? 0)}
              subtext="En período de confirmación"
            />
            <StatCard
              icon={ShoppingBag}
              color="text-purple-600"
              bg="bg-purple-50 dark:bg-purple-950/30"
              label="Ventas Registradas"
              value={`${data.summary?.totalSales ?? 0} u.`}
              subtext="Total unidades vendidas"
            />
            <StatCard
              icon={TrendingUp}
              color="text-blue-600"
              bg="bg-blue-50 dark:bg-blue-950/30"
              label="Facturación Bruta"
              value={fmt(data.summary?.totalRevenue ?? 0)}
              subtext="Volumen total vendido"
            />
          </div>

          {/* Historial de Ventas */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Historial Detallado de Ventas</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Cada vez que un creador cierra una venta en TikTok Shop, recibes tu comisión correspondiente.
                </p>
              </div>

              {/* Filtros de Ventas */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Todas' },
                  { id: 'APPROVED', label: 'Disponibles' },
                  { id: 'PENDING', label: 'Pendientes' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSalesFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      salesFilter === f.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Ventas */}
            <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 border-b border-gray-100 dark:border-dark-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar venta por nombre de producto o nombre de creador..."
                  value={salesSearch}
                  onChange={e => setSalesSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {salesSearch && (
                  <button
                    onClick={() => setSalesSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Ventas */}
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-dark-500 text-sm">
                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">No hay ventas registradas</p>
                <p className="text-xs mt-1">Aparecerán aquí a medida que tus creadores publiquen contenido y vendan.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {filteredSales.map((s: any) => {
                  const mine = s.commissions?.find((c: any) => c.type === 'STUDENT');
                  return (
                    <div key={s.id} className="p-4 sm:p-5 flex items-center gap-3.5 hover:bg-gray-50/70 dark:hover:bg-dark-750 transition-colors">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
                        {s.product?.imageUrl ? (
                          <img src={s.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (s.product?.name?.[0]?.toUpperCase() || 'P')
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                          {highlightMatch(s.product?.name || 'Producto', salesSearch)} × {s.quantity}
                          <span className="text-gray-400 font-normal"> · Creador: {highlightMatch(s.creator?.name || 'Afiliado', salesSearch)}</span>
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                          {new Date(s.saleDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · Facturado: '}{fmt(s.unitPrice * s.quantity)}
                        </p>
                      </div>

                      {mine && (
                        <div className="text-right shrink-0">
                          <p className={clsx('text-sm sm:text-base font-black',
                            mine.status === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                            +{fmt(mine.amount)}
                          </p>
                          <span className={clsx('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5',
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
      )}

      {/* ─── TAB 4: Material Creativo & Recursos ─── */}
      {currentTab === 'material' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                  <span>Material Promocional y Recursos</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Imágenes en alta resolución, guiones y videos virales para inspirar a tus creadores o reutilizar en marketing.
                </p>
              </div>

              <button
                onClick={loadMaterial}
                disabled={loadingMaterial}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-dark-200 transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMaterial ? 'animate-spin' : ''}`} />
                <span>Actualizar Recursos</span>
              </button>
            </div>

            {/* Barra de Filtros y Buscador estilo WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100 dark:border-dark-700">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar material por producto, video o imagen..."
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                {materialSearch && (
                  <button
                    onClick={() => setMaterialSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros de Formato */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setMaterialFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    materialFilter === 'ALL'
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Todos los formatos
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('VIDEO')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    materialFilter === 'VIDEO'
                      ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-rose-500" /> 🎬 Solo Videos UGC
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('IMAGE')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    materialFilter === 'IMAGE'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> 📸 Solo Fotos HD
                </button>
              </div>
            </div>

            {loadingMaterial ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <p className="text-xs text-gray-400">Cargando catálogo multimedia...</p>
              </div>
            ) : materialData?.categories?.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Film className="w-10 h-10 mx-auto text-gray-300 dark:text-dark-600 mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">Aún no hay materiales multimedia cargados</p>
                <p className="text-xs text-gray-400 mt-1">El administrador subirá recursos y videos próximamente.</p>
              </div>
            ) : (
              <div className="space-y-8 mt-4">
                {(materialData?.categories || []).map((cat: any) => {
                  const filteredProducts = (cat.products || []).filter((p: any) => {
                    if (materialSearch.trim()) {
                      const q = materialSearch.toLowerCase();
                      const matchName = p.name?.toLowerCase().includes(q);
                      const matchCat = cat.name?.toLowerCase().includes(q);
                      const matchMedia = (p.media || []).some((m: any) => m.title?.toLowerCase().includes(q));
                      if (!matchName && !matchCat && !matchMedia) return false;
                    }
                    if (materialFilter !== 'ALL') {
                      const hasType = (p.media || []).some((m: any) => m.type === materialFilter);
                      if (!hasType) return false;
                    }
                    return true;
                  });

                  if (filteredProducts.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>{highlightMatch(cat.name, materialSearch)}</span>
                        <span className="text-xs font-normal text-gray-400">({filteredProducts.length} productos)</span>
                      </h3>

                      <div className="space-y-6">
                        {filteredProducts.map((prod: any) => {
                          const videos = (prod.media || []).filter((m: any) => m.type === 'VIDEO');
                          const images = (prod.media || []).filter((m: any) => m.type === 'IMAGE');

                          const showVideos = materialFilter === 'ALL' || materialFilter === 'VIDEO';
                          const showImages = materialFilter === 'ALL' || materialFilter === 'IMAGE';

                          return (
                            <div key={prod.id} className="rounded-3xl border border-gray-200 dark:border-dark-700 p-5 bg-white dark:bg-dark-800 shadow-sm space-y-4">
                              {/* Header del Producto */}
                              <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-dark-700">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-700 shrink-0 flex items-center justify-center">
                                    {prod.imageUrl ? (
                                      <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-dark-100 truncate">
                                      {highlightMatch(prod.name, materialSearch)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                        🎬 {videos.length} videos UGC
                                      </span>
                                      <span className="text-gray-300 dark:text-dark-600">·</span>
                                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                        📸 {images.length} fotos HD
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* SECCIÓN 1: VIDEOS UGC (VERTICAL 9:16 CON ROSA/ROJO) */}
                              {showVideos && videos.length > 0 && (
                                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-gradient-to-b from-rose-50/20 to-transparent dark:from-rose-950/10 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[11px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                                        <Film className="w-3 h-3" /> VIDEOS UGC
                                      </span>
                                      <span className="text-xs font-bold text-gray-800 dark:text-dark-200">
                                        {videos.length} video{videos.length === 1 ? '' : 's'} listos para publicar
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200/50">
                                      Formato 9:16 Vertical HD
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {videos.map((m: any) => (
                                      <div key={m.id} className="relative group rounded-2xl overflow-hidden border-2 border-rose-300 dark:border-rose-800 bg-black aspect-[9/14] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                        <video src={m.url} className="w-full h-full object-cover" muted preload="metadata" />

                                        {/* Badge Video */}
                                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-sm text-white text-[9px] font-black flex items-center gap-1 shadow">
                                          <Film className="w-2.5 h-2.5" /> VIDEO
                                        </div>

                                        {/* Play Overlay */}
                                        <div
                                          onClick={() => setMediaPreview({ url: m.url, type: 'VIDEO', title: m.title || prod.name })}
                                          className="absolute inset-0 bg-black/40 group-hover:bg-black/20 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all"
                                        >
                                          <div className="w-10 h-10 rounded-full bg-white text-gray-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Play className="w-4 h-4 fill-current ml-0.5 text-rose-600" />
                                          </div>
                                          <span className="text-[10px] font-bold text-white drop-shadow">Reproducir</span>
                                        </div>

                                        {/* Acciones de Tarjeta */}
                                        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                                          <a
                                            href={m.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors shadow"
                                            title="Descargar video"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* SECCIÓN 2: FOTOS & BANNERS HD (CUADRADOS CON AZUL/CYAN) */}
                              {showImages && images.length > 0 && (
                                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/10 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                                        <ImageIcon className="w-3 h-3" /> FOTOS & BANNERS HD
                                      </span>
                                      <span className="text-xs font-bold text-gray-800 dark:text-dark-200">
                                        {images.length} imagen{images.length === 1 ? '' : 'es'} en alta resolución
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/50">
                                      Alta Definición · JPG / PNG
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {images.map((m: any) => (
                                      <div key={m.id} className="relative group rounded-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-dark-900 aspect-square shadow-sm hover:shadow-md transition-shadow">
                                        <img src={m.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                                        {/* Badge Foto */}
                                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-black flex items-center gap-1 shadow">
                                          <ImageIcon className="w-2.5 h-2.5" /> FOTO
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                                          <button
                                            type="button"
                                            onClick={() => setMediaPreview({ url: m.url, type: 'IMAGE', title: m.title || prod.name })}
                                            className="px-2.5 py-1.5 rounded-xl bg-white text-gray-900 text-[10px] font-bold flex items-center gap-1 shadow hover:bg-gray-100"
                                          >
                                            <Eye className="w-3 h-3 text-blue-600" /> Ver
                                          </button>
                                          <a
                                            href={m.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
                                            title="Descargar foto"
                                          >
                                            <Download className="w-3 h-3" />
                                          </a>
                                        </div>
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Calculadora Interactiva de Ganancias ─── */}
      {currentTab === 'calculator' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controles de Simulación */}
            <div className="lg:col-span-6 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-900 dark:text-dark-100">Simulador de Comisiones TikTok Shop</h2>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Ajusta los parámetros para estimar tu potencial mensual</p>
                </div>
              </div>

              {/* Slider 1: Creadores */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">👥 Creadores Activos en tu Red</span>
                  <span className="font-black text-pink-600 dark:text-pink-400 text-sm bg-pink-50 dark:bg-pink-900/30 px-2.5 py-0.5 rounded-lg">
                    {calcCreators} creadores
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={calcCreators}
                  onChange={e => setCalcCreators(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* Slider 2: Ventas por Creador */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">📦 Ventas Promedio al Mes por Creador</span>
                  <span className="font-black text-purple-600 dark:text-purple-400 text-sm bg-purple-50 dark:bg-purple-900/30 px-2.5 py-0.5 rounded-lg">
                    {calcSalesPerCreator} ventas/mes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={calcSalesPerCreator}
                  onChange={e => setCalcSalesPerCreator(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Slider 3: Precio del Producto */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">🏷️ Precio Promedio del Producto</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-lg">
                    {fmt(calcAvgPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={calcAvgPrice}
                  onChange={e => setCalcAvgPrice(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Slider 4: Tasa de Comisión */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">💰 Porcentaje de Comisión</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-lg">
                    {calcCommissionRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={calcCommissionRate}
                  onChange={e => setCalcCommissionRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Pantalla de Resultados Proyectados */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Proyección Estimada</span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 font-medium">Ganancia Mensual Proyectada</p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                    {fmt(calcTotalMonthlyCommission)} <span className="text-sm font-semibold text-gray-400">/ mes</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Ganancia Diaria</p>
                    <p className="text-base font-bold text-cyan-300 mt-0.5">{fmt(calcDailyCommission)}/día</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Ganancia Anual</p>
                    <p className="text-base font-bold text-purple-300 mt-0.5">{fmt(calcAnnualCommission)}/año</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Unidades Vendidas</p>
                    <p className="text-base font-bold text-white mt-0.5">{calcCreators * calcSalesPerCreator} u./mes</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-gray-400">Facturación Bruta</p>
                    <p className="text-base font-bold text-amber-300 mt-0.5">{fmt(calcTotalMonthlyVolume)}/mes</p>
                  </div>
                </div>
              </div>

              <div className="relative pt-4 border-t border-white/10 text-xs text-gray-300">
                <p className="font-semibold text-white mb-1">💡 Estrategia de Crecimiento:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Para duplicar tus ganancias, agrega más creadores a tu equipo ({fmt(data.extraCreatorPrice)} c/u) y asegúrate de elegir productos de alta conversión en tus slots.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Selector de Producto para Slots ─── */}
      {pickerSlot != null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setPickerSlot(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl max-w-lg w-full p-5 max-h-[85vh] flex flex-col gap-4 border border-gray-100 dark:border-dark-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-700">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">Elige un Producto para el Espacio #{pickerSlot + 1}</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Selecciona el producto del catálogo que quieres que ofrezcan</p>
              </div>
              <button onClick={() => setPickerSlot(null)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador dentro del modal */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            {/* Lista con scroll */}
            <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
              {filteredPickerProducts.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSlots(prev => prev.map((x, j) => (j === pickerSlot ? p.id : x)));
                    setPickerSlot(null);
                    setPickerSearch('');
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 dark:border-dark-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 text-left transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-dark-100 truncate">
                      {highlightMatch(p.name, pickerSearch)}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                      {fmt(p.price)} · Ganancia: +{fmt(p.price * ((p.commissionRate ?? 25) / 100))}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Pago de Creador Extra Pendiente ─── */}
      {pendingPay && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">Pago de Creador Extra</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400">Verificación automática en tiempo real</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-300 leading-relaxed">
              Completa tu pago de <span className="font-black text-gray-900 dark:text-white">{fmt(pendingPay.amount ?? data.extraCreatorPrice)}</span> para añadir un espacio más a tu equipo de creadores.
              {pendingPay.remainingMin != null && pendingPay.remainingMin > 0 && (
                <span className="text-amber-600 dark:text-amber-400 text-xs block font-semibold mt-1">
                  ⏳ Tienes {pendingPay.remainingMin} minutos antes de que expire la orden.
                </span>
              )}
            </p>

            <div className="flex gap-2.5 pt-2">
              {pendingPay.invoiceUrl && (
                <button
                  onClick={() => window.open(pendingPay.invoiceUrl, '_blank')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ir a Pagar Factura</span>
                </button>
              )}
              <button
                onClick={() => setPendingPay(null)}
                className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                Cerrar
              </button>
            </div>

            <button
              onClick={() => pendingPay.id && startPolling(pendingPay.id)}
              className="w-full inline-flex items-center justify-center gap-2 text-xs text-pink-600 dark:text-pink-400 font-bold py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar estado del pago ahora</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Previsualización Multimedia ─── */}
      {mediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setMediaPreview(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-3xl max-w-2xl w-full p-5 flex flex-col gap-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-dark-100">{mediaPreview.title || 'Previsualización'}</h3>
              <button onClick={() => setMediaPreview(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              {mediaPreview.type === 'VIDEO' ? (
                <video src={mediaPreview.url} controls autoPlay className="w-full max-h-[55vh] object-contain" />
              ) : (
                <img src={mediaPreview.url} alt="" className="w-full max-h-[55vh] object-contain" />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={mediaPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Archivo
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Landing Page previa a la activación ───
function LandingView({ data, activating, onActivate }: { data: any; activating: boolean; onActivate: () => void }) {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % loadingPhrases.length), 2800);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { icon: Search, title: 'Buscamos creadores calificados', desc: 'Asignamos afiliados certificados de TikTok Shop y les enviamos muestras gratuitas y guiones virales.' },
    { icon: Play, title: 'Ellos graban y publican videos', desc: 'Tus creadores publican contenido atractivo con los productos en sus cuentas sin que tú tengas que grabarte.' },
    { icon: TrendingUp, title: 'Cobras tus comisiones', desc: `Recibes el ${data?.products?.[0]?.commissionRate ?? 25}% directo por cada venta entregada. Saldo transferible a tu billetera.` },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in py-2">
      {/* Hero Visual */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <TikTokLogo className="w-12 h-12" />
            <div>
              <p className="font-black text-xl tracking-tight">TikTok Shop Affiliate Studio</p>
              <p className="text-xs text-gray-400 font-medium">Automatización de ventas con creadores de contenido</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
            Vende en TikTok Shop a través de creadores <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">sin grabarte ni tener LLC.</span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Te asignamos creadores de contenido afiliados que promocionan productos reales en TikTok. Por cada venta generada, recibes tu comisión de forma 100% pasiva y automática.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-bold">
                Tu membresía te incluye{' '}
                <span className="text-amber-300 font-black">
                  {data?.campaign?.packType === 1000 ? '10' : '5'} creadores
                </span>{' '}
                de contenido iniciales
              </span>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={onActivate}
              disabled={activating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-500 hover:to-rose-500 text-white text-base font-black tracking-wide shadow-xl shadow-pink-600/40 transition-all transform active:scale-98 disabled:opacity-60"
            >
              {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{activating ? 'ACTIVANDO TIKTOK SHOP...' : 'ACTIVAR TIKTOK SHOP AHORA'}</span>
            </button>
            {activating && (
              <p className="text-xs text-pink-300 font-medium mt-2 animate-pulse">
                {loadingPhrases[phraseIdx]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3 Pasos */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-100 mb-4 flex items-center gap-2">
          <Sparkle className="w-5 h-5 text-pink-500" />
          <span>¿Cómo funciona el proceso?</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-black">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-dark-100">
                  <span className="text-pink-500 font-black mr-1">{i + 1}.</span> {s.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Puente a VIP Pro */}
      <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-fuchsia-900 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <p className="font-black text-lg">¿Quieres dominar la estrategia y crear tus propias cuentas?</p>
          <p className="text-xs sm:text-sm text-purple-200">
            En el módulo VIP Pro te capacitamos en creación de contenido viral, estructuras de video y escalado sin LLC.
          </p>
        </div>
        <Link
          to="/vip-pro"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-purple-900 font-black text-xs hover:bg-purple-50 transition-all shadow-md"
        >
          <CheckCircle className="w-4 h-4 text-purple-700" />
          <span>Ver Módulo VIP Pro</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, bg, label, value, subtext }: { icon: any; color: string; bg: string; label: string; value: string; subtext?: string }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 sm:p-5 flex items-start gap-3.5">
      <div className={`p-3 rounded-2xl ${bg} shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-dark-400 font-medium">{label}</p>
        <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-dark-100 truncate mt-0.5">{value}</p>
        {subtext && <p className="text-[10px] text-gray-400 dark:text-dark-500 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
}
