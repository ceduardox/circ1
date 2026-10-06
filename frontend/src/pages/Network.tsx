import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Link as LinkIcon, Copy, Check, Users, Share2, Globe, Shield, List, GitBranch,
  Sparkles, UserPlus2, Users2, BadgePercent, Crown, Loader2, Mail, QrCode,
  MessageCircle, Send, Calculator, TrendingUp, AlertCircle, CheckCircle2,
  X, Search, Filter, ArrowRight, ExternalLink, RefreshCw, Zap, DollarSign,
  UserCheck, UserX, HelpCircle, ChevronRight, Network
} from 'lucide-react';
import { membershipApi, authApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { useAuthStore } from '@/store/authStore';
import { NetworkTree, TreeMember } from '@/components/program/NetworkTree';
import { PageHeader } from '@/components/ui';
import { countryFlag } from '@/lib/utils';
import 'flag-icons/css/flag-icons.min.css';
import { toast } from 'sonner';

const statusStyles: Record<string, { label: string; classes: string; dot: string }> = {
  ACTIVE: {
    label: 'Activo',
    classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500 animate-pulse',
  },
  INACTIVE: {
    label: 'Inactivo',
    classes: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 border border-gray-200 dark:border-dark-600',
    dot: 'bg-gray-400',
  },
  REVOKED: {
    label: 'Revocado',
    classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50',
    dot: 'bg-red-500',
  },
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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

export function NetworkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const { status, fetchStatus } = useMembershipStore();
  const [network, setNetwork] = useState<any>({ level1: [], level2: [], count: { level1: 0, level2: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['estandar', 'elite']);
  const [savingPlans, setSavingPlans] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Filtros y búsqueda de miembros
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'level1' | 'level2' | 'active' | 'inactive'>('all');

  // Estado calculadora interactiva
  const [calcN1, setCalcN1] = useState<number>(5);
  const [calcN2PerPerson, setCalcN2PerPerson] = useState<number>(3);
  const [calcPlanPrice, setCalcPlanPrice] = useState<number>(200);

  const currentUser = useAuthStore(s => s.user);

  // Sincroniza tab
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Sincroniza la selección con lo que el servidor dice que verán tus referidos.
  useEffect(() => {
    if (status?.referralPlans?.length) {
      setSelectedPlans(status.referralPlans);
    }
  }, [status?.referralPlans]);

  const savePlans = async (plans: string[]) => {
    setSavingPlans(true);
    try {
      const { data } = await authApi.updateReferralPlans(plans);
      setSelectedPlans(data.plans);
      toast.success('Plan de referidos actualizado correctamente');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo actualizar la configuración');
    } finally {
      setSavingPlans(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [netRes, st] = await Promise.all([membershipApi.network(), fetchStatus()]);
      setNetwork(netRes.data);
      void st;
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar tu red');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!status?.referralLink) return;
    try {
      await navigator.clipboard.writeText(status.referralLink);
      setCopied(true);
      toast.success('¡Enlace de referido copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  // Compartir en WhatsApp
  const shareWhatsApp = () => {
    if (!status?.referralLink) return;
    const text = `🚀 ¡Hola! Te invito a unirte a Círculo 1. Descubre cómo transformar tu mentalidad y generar ingresos en red:\n\n👉 ${status.referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Compartir en Telegram
  const shareTelegram = () => {
    if (!status?.referralLink) return;
    const text = `🚀 ¡Únete a Círculo 1 y construye tu franquicia de dropshipping e ingresos en red!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(status.referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Compartir Nativo Móvil
  const shareNative = async () => {
    if (!status?.referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a Círculo 1',
          text: 'Descubre cómo transformar tu mentalidad y generar ingresos en red.',
          url: status.referralLink,
        });
      } catch {
        // Cancelado o cerrado
      }
    } else {
      void copyLink();
    }
  };

  // Miembros combinados y estadísticas
  const allMembers = useMemo(() => {
    const l1 = (network.level1 || []).map((m: any) => ({ ...m, networkLevel: 1 }));
    const l2 = (network.level2 || []).map((m: any) => ({ ...m, networkLevel: 2 }));
    return [...l1, ...l2];
  }, [network]);

  const activeCount = useMemo(() => allMembers.filter(m => m.membershipStatus === 'ACTIVE').length, [allMembers]);
  const inactiveCount = allMembers.length - activeCount;
  const activePct = allMembers.length > 0 ? Math.round((activeCount / allMembers.length) * 100) : 0;
  const lostPerInactive = ((status?.settings?.level1Percent || 25) / 100) * (status?.settings?.membershipPrice || 500);
  const totalLost = inactiveCount * lostPerInactive;
  const totalEarnedInNetwork = useMemo(() => allMembers.reduce((acc, m) => acc + (m.earned || 0), 0), [allMembers]);

  // Filtrado de miembros en tiempo real
  const filteredMembers = useMemo(() => {
    return allMembers.filter(member => {
      // Filtro de nivel/estado
      if (memberFilter === 'level1' && member.networkLevel !== 1) return false;
      if (memberFilter === 'level2' && member.networkLevel !== 2) return false;
      if (memberFilter === 'active' && member.membershipStatus !== 'ACTIVE') return false;
      if (memberFilter === 'inactive' && member.membershipStatus === 'ACTIVE') return false;

      // Filtro de búsqueda
      if (!memberSearch.trim()) return true;
      const q = memberSearch.toLowerCase();
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const user = (member.username || '').toLowerCase();
      const country = (member.country || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const code = (member.referralCode || '').toLowerCase();

      return name.includes(q) || user.includes(q) || country.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [allMembers, memberFilter, memberSearch]);

  // Árbol jerárquico
  const treeRoots: TreeMember[] = useMemo(() => {
    return (network.level1 || []).map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      country: u.country,
      avatarUrl: u.avatarUrl,
      membershipStatus: u.membershipStatus,
      children: (network.level2 || [])
        .filter((c: any) => c.parentId === u.id)
        .map((c: any) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          username: c.username,
          country: c.country,
          avatarUrl: c.avatarUrl,
          membershipStatus: c.membershipStatus,
          parentId: c.parentId,
        })),
    }));
  }, [network]);

  // Todos los planes disponibles
  const allAvailablePlans = useMemo(() => {
    if (status?.settings?.plans && status.settings.plans.length > 0) {
      return status.settings.plans;
    }
    return [
      { id: 'start', name: 'Start', price: 200 },
      { id: 'estandar', name: 'Estándar', price: 500 },
      { id: 'elite', name: 'Élite', price: 1000 },
    ];
  }, [status?.settings?.plans]);

  // Cálculo de la calculadora
  const calcTotalN2 = calcN1 * calcN2PerPerson;
  const calcL1Earning = calcN1 * (calcPlanPrice * ((status?.settings?.level1Percent || 25) / 100));
  const calcL2Earning = calcTotalN2 * (calcPlanPrice * ((status?.settings?.level2Percent || 5) / 100));
  const calcGrandTotal = calcL1Earning + calcL2Earning;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500 dark:text-dark-400">Cargando tu red y comisiones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado Principal */}
      <PageHeader
        title="Mi Red y Afiliados"
        subtitle="Gestiona tu enlace de referencia, tus equipos de nivel 1 y 2, y tus comisiones"
        icon={Network}
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        }
      />

      {/* HERO CARD: Enlace de Referido + Compartir Rápido */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-purple-900 text-white shadow-xl shadow-primary-700/20 border border-white/10 p-5 sm:p-7">
        {/* Glows de fondo */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 opacity-10 hidden sm:block pointer-events-none">
          <Crown className="w-32 h-32" />
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          {/* Fila superior: Título e Insignia */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Tu Enlace de Afiliado</h2>
                <p className="text-xs text-primary-200">Comparte y gana 25% directo (N1) y 5% en segundo nivel (N2)</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {activeCount} {activeCount === 1 ? 'afiliado activo' : 'afiliados activos'}
            </div>
          </div>

          {/* Caja del Enlace + Copiar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 min-w-0 bg-black/25 border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono truncate text-white/95 backdrop-blur-sm select-all">
              {status?.referralLink || 'Cargando enlace...'}
            </div>
            <button
              onClick={copyLink}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all duration-200 shrink-0 ${
                copied
                  ? 'bg-emerald-400 text-emerald-950 scale-105'
                  : 'bg-white text-primary-800 hover:bg-primary-50 active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Enlace'}
            </button>
          </div>

          {/* Botones de Compartir Rápido en 1-Click */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
            <span className="text-xs font-medium text-primary-200 mr-1 hidden sm:inline">Compartir en:</span>
            
            {/* WhatsApp */}
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>

            {/* Telegram */}
            <button
              onClick={shareTelegram}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </button>

            {/* Móvil Nativo */}
            <button
              onClick={shareNative}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartir
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:scale-95 ml-auto sm:ml-0"
            >
              <QrCode className="w-3.5 h-3.5" /> Código QR
            </button>
          </div>
        </div>
      </div>

      {/* SUBMENÚ DE NAVEGACIÓN (Segmented Tabs Bar) */}
      <div className="sticky top-2 z-30 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md rounded-2xl p-1.5 border border-gray-200/80 dark:border-dark-700/80 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max sm:min-w-0 sm:justify-start">
          <button
            onClick={() => setTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'overview'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
            }`}
          >
            <Zap className="w-4 h-4" /> Link y Planes
          </button>

          <button
            onClick={() => setTab('members')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'members'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
            }`}
          >
            <Users className="w-4 h-4" /> Mi Red
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              currentTab === 'members' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-dark-300'
            }`}>
              {allMembers.length}
            </span>
          </button>

          <button
            onClick={() => setTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'tree'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
            }`}
          >
            <GitBranch className="w-4 h-4" /> Árbol Gráfico
          </button>

          <button
            onClick={() => setTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'calculator'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
            }`}
          >
            <Calculator className="w-4 h-4" /> Calculadora
          </button>

          <button
            onClick={() => setTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'stats'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Estadísticas
          </button>
        </div>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}

      {/* ─── TAB 1: OVERVIEW (LINK Y PLANES) ─── */}
      {currentTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Selector de Planes a Promocionar */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  ¿Qué plan verán tus prospectos al abrir tu enlace?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                  Elige si deseas que compren un plan específico o que puedan elegir entre todos los disponibles.
                </p>
              </div>
              {savingPlans && (
                <span className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Opciones individuales por plan */}
              {allAvailablePlans.map(pl => {
                const isActive = selectedPlans.length === 1 && selectedPlans[0] === pl.id;
                const l1 = (pl.price * (status?.settings?.level1Percent || 25)) / 100;
                const l2 = (pl.price * (status?.settings?.level2Percent || 5)) / 100;

                return (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={savingPlans}
                    onClick={() => {
                      setSelectedPlans([pl.id]);
                      void savePlans([pl.id]);
                    }}
                    className={`relative p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                      isActive
                        ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 shadow-md ring-2 ring-primary-500/20'
                        : 'border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-700/30 hover:border-gray-300 dark:hover:border-dark-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                          Plan {pl.name}
                        </span>
                        {isActive && (
                          <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-dark-100">
                        ${pl.price} <span className="text-xs font-normal text-gray-500">USD</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-dark-600/60 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600 dark:text-dark-300 font-medium">
                        <span>Ganas en N1 (Directo):</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{fmt(l1)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-dark-400 text-[11px]">
                        <span>Ganas en N2 (Indirecto):</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">+{fmt(l2)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Opción: Todos los planes */}
              {(() => {
                const isAllActive = selectedPlans.length === allAvailablePlans.length && allAvailablePlans.every(p => selectedPlans.includes(p.id));
                return (
                  <button
                    type="button"
                    disabled={savingPlans}
                    onClick={() => {
                      const allIds = allAvailablePlans.map(p => p.id);
                      setSelectedPlans(allIds);
                      void savePlans(allIds);
                    }}
                    className={`relative p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                      isAllActive
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-500/20'
                        : 'border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-700/30 hover:border-gray-300 dark:hover:border-dark-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Todos los Planes
                        </span>
                        {isAllActive && (
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-dark-100">
                        Catálogo Abierto
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                        El referido puede elegir libremente cualquier membresía disponible.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-dark-600/60 text-xs text-purple-600 dark:text-purple-300 font-semibold">
                      Comisiones automáticas según el plan comprado
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Tarjetas Informativas de Comisiones por Plan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allAvailablePlans.map((pl, idx) => {
              const l1 = (pl.price * (status?.settings?.level1Percent || 25)) / 100;
              const l2 = (pl.price * (status?.settings?.level2Percent || 5)) / 100;

              return (
                <div
                  key={pl.id}
                  className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        idx === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                        idx === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                      }`}>
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-dark-100">Plan {pl.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-dark-400">${pl.price} USD</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-gray-50 dark:bg-dark-700/40 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-dark-300 flex items-center gap-1.5 font-medium">
                        <UserPlus2 className="w-3.5 h-3.5 text-emerald-500" /> Nivel 1 (25% Directo):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{fmt(l1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-dark-300 flex items-center gap-1.5 font-medium">
                        <Users2 className="w-3.5 h-3.5 text-purple-500" /> Nivel 2 (5% Indirecto):
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{fmt(l2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MI RED (MIEMBROS) ─── */}
      {currentTab === 'members' && (
        <div className="space-y-5 animate-fade-in">
          {/* Barra de Filtros y Buscador estilo WhatsApp */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-4 sm:p-5 shadow-sm space-y-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Buscar por nombre, usuario, país, código o correo..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              {memberSearch && (
                <button
                  onClick={() => setMemberSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  memberFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200'
                }`}
              >
                Todos ({allMembers.length})
              </button>

              <button
                onClick={() => setMemberFilter('level1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  memberFilter === 'level1'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200'
                }`}
              >
                Directos Nivel 1 ({network.count.level1 || 0})
              </button>

              <button
                onClick={() => setMemberFilter('level2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  memberFilter === 'level2'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200'
                }`}
              >
                Indirectos Nivel 2 ({network.count.level2 || 0})
              </button>

              <button
                onClick={() => setMemberFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  memberFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200'
                }`}
              >
                Activos ({activeCount})
              </button>

              <button
                onClick={() => setMemberFilter('inactive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  memberFilter === 'inactive'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200'
                }`}
              >
                Inactivos ({inactiveCount})
              </button>
            </div>
          </div>

          {/* Lista de Miembros */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-800 dark:text-dark-100">No se encontraron miembros</h4>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 max-w-sm mx-auto">
                {memberSearch
                  ? `No hay coincidencias para "${memberSearch}". Intenta con otro término.`
                  : 'Aún no tienes afiliados en esta categoría. ¡Comparte tu link de referido para comenzar a armar tu equipo!'}
              </p>
              {allMembers.length === 0 && (
                <button
                  onClick={copyLink}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar mi link ahora
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMembers.map(member => {
                const st = statusStyles[member.membershipStatus] || statusStyles.INACTIVE;
                const flag = countryFlag(member.country);
                const isL1 = member.networkLevel === 1;
                const refLink = member.referralCode ? `${window.location.origin}/register?ref=${member.referralCode}` : null;

                return (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200/80 dark:border-dark-700/80 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      {/* Fila Superior: Avatar + Info + Badges */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md ${
                            isL1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-fuchsia-600'
                          }`}>
                            {(member.firstName?.[0] || member.username?.[0] || '?').toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-800 ${st.dot}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                              {highlightMatch(`${member.firstName || member.username} ${member.lastName || ''}`.trim(), memberSearch)}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isL1
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                            }`}>
                              Nivel {member.networkLevel}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 flex items-center gap-1.5">
                            {flag ? (
                              <span className={`fi fi-${flag} shrink-0 rounded-sm shadow-sm`} style={{ width: '1rem', height: '0.72rem', backgroundSize: 'cover' }} />
                            ) : (
                              <Globe className="w-3 h-3 shrink-0" />
                            )}
                            <span className="truncate">{highlightMatch(member.country || 'Sin país', memberSearch)}</span>
                            <span className="text-gray-300 dark:text-dark-600">•</span>
                            <span className="text-[11px] text-gray-400">@{highlightMatch(member.username, memberSearch)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Info de Correo & Ganancia */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-dark-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {member.email && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-dark-400 truncate max-w-[200px]">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{highlightMatch(member.email, memberSearch)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {member.earned > 0 ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              Ganaste {fmt(member.earned)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">Sin compras</span>
                          )}
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.classes}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Código de referido del miembro (para líderes que apoyan a su equipo) */}
                    {member.referralCode && (
                      <div className="bg-gray-50 dark:bg-dark-700/40 rounded-xl p-2 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-gray-400 shrink-0">Link del miembro:</span>
                        <code className="text-primary-600 dark:text-primary-400 font-mono truncate font-semibold">
                          {member.referralCode}
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!refLink) return;
                            await navigator.clipboard.writeText(refLink);
                            toast.success(`Enlace de ${member.firstName || member.username} copiado`);
                          }}
                          className="shrink-0 px-2 py-1 rounded-lg bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 font-semibold border border-gray-200 dark:border-dark-600 transition-all active:scale-95"
                        >
                          Copiar Link
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ÁRBOL GRÁFICO ─── */}
      {currentTab === 'tree' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 sm:p-6 shadow-sm animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary-500" />
                Estructura Visual Unilevel
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Visualiza tus ramas directas y cómo se ramifica cada patrocinador en tu red.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Activo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Inactivo
              </span>
            </div>
          </div>

          {treeRoots.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-dark-500 text-sm">
              <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-40" />
              Aún no tienes miembros en tu red. ¡Comparte tu enlace de referido para ver crecer tu árbol!
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/40 overflow-hidden">
              <NetworkTree roots={treeRoots} currentUser={currentUser} />
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: CALCULADORA DE INGRESOS ─── */}
      {currentTab === 'calculator' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 sm:p-7 shadow-sm animate-fade-in space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100">
                Simulador de Ganancias de Red
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Calcula cuánto dinero ganarías con tu equipo según el número de afiliados y el plan que elijan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Controles de la Calculadora */}
            <div className="lg:col-span-2 space-y-5 bg-gray-50/70 dark:bg-dark-700/30 p-5 rounded-2xl border border-gray-200/80 dark:border-dark-600/80">
              {/* Slider 1: Directos N1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-dark-100">
                  <span>Tus Afiliados Directos (Nivel 1):</span>
                  <span className="text-primary-600 dark:text-primary-400 text-base font-black">{calcN1} directos</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={calcN1}
                  onChange={e => setCalcN1(Number(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>1</span>
                  <span>10</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              {/* Slider 2: Indirectos por Directo */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-gray-900 dark:text-dark-100">
                  <span>Afiliados que trae cada directo (Nivel 2):</span>
                  <span className="text-purple-600 dark:text-purple-400 text-base font-black">{calcN2PerPerson} c/u ({calcTotalN2} en total)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={calcN2PerPerson}
                  onChange={e => setCalcN2PerPerson(Number(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              {/* Selector de Plan para el cálculo */}
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-dark-600">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-400">
                  Plan que compran los afiliados:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allAvailablePlans.map(pl => (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setCalcPlanPrice(pl.price)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        calcPlanPrice === pl.price
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                          : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-dark-300 border-gray-200 dark:border-dark-600 hover:bg-gray-50'
                      }`}
                    >
                      {pl.name} (${pl.price})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultado Proyectado */}
            <div className="bg-gradient-to-br from-primary-900 via-purple-950 to-dark-900 text-white p-6 rounded-3xl shadow-xl border border-white/10 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-200">
                Ganancia Potencial Total
              </span>

              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {fmt(calcGrandTotal)} <span className="text-sm font-normal text-white/70">USD</span>
              </p>

              <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/80">Directos N1 ({calcN1} × {fmt(calcPlanPrice * 0.25)}):</span>
                  <span className="font-bold text-emerald-300">{fmt(calcL1Earning)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Indirectos N2 ({calcTotalN2} × {fmt(calcPlanPrice * 0.05)}):</span>
                  <span className="font-bold text-purple-300">{fmt(calcL2Earning)}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 text-[11px] text-white/80">
                💡 <span className="font-semibold text-white">Consejo PRO:</span> Con solo 5 directos activos que traigan a 3 cada uno, acumulas <strong>{fmt(calcGrandTotal)} USD</strong> en tu billetera.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: ESTADÍSTICAS Y SALUD ─── */}
      {currentTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wide">Total en Red</p>
                <p className="text-2xl font-black text-gray-900 dark:text-dark-100">{allMembers.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-inner">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wide">Miembros Activos</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount} ({activePct}%)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 shadow-inner">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wide">Miembros Inactivos</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{inactiveCount}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-dark-400 uppercase tracking-wide">Total Generado</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{fmt(totalEarnedInNetwork)}</p>
              </div>
            </div>
          </div>

          {/* Salud de la Red y Retención */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> Salud y Retención del Equipo
            </h3>

            {/* Barra de progreso de retención */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-dark-300">
                <span>Tasa de Actividad de la Red</span>
                <span>{activePct}% Activos</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden flex">
                <div style={{ width: `${activePct}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
                <div style={{ width: `${100 - activePct}%` }} className="bg-amber-400 h-full transition-all duration-500" />
              </div>
            </div>

            {inactiveCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-bold text-sm">Dinero retenido por miembros inactivos: {fmt(totalLost)} USD</p>
                  <p>
                    Tienes {inactiveCount} miembro{inactiveCount === 1 ? '' : 's'} inactivo{inactiveCount === 1 ? '' : 's'} en tu red. Si renuevan su membresía, se desbloquearán comisiones adicionales para ti de inmediato.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL DE CÓDIGO QR ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-dark-700 relative text-center space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-dark-100">Tu Código QR de Afiliado</h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                Muestra este código a tus prospectos para que lo escaneen directamente con la cámara de su celular.
              </p>
            </div>

            {/* Imagen QR generada */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 dark:border-dark-600 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(status?.referralLink || '')}&margin=10`}
                alt="Código QR de referido"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Link
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 font-bold text-xs hover:bg-gray-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
