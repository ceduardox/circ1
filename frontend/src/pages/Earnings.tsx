import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, Clock, Download, History, AlertCircle, Loader2,
  Landmark, CircleDollarSign, Coins, Trash2, CheckCircle2, Search, X,
  ArrowUpRight, ArrowDownRight, ShieldCheck, DollarSign, Calculator,
  ChevronRight, Sparkles, Filter, CreditCard, RefreshCw, Copy, Check,
  Info, ExternalLink, HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { membershipApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { ButtonPrimary, Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, PageHeader } from '@/components/ui';
import { maskAddress } from '@/lib/utils';
import { toast } from 'sonner';

const methodOptions = [
  { value: 'USDT_BEP20', label: 'USDT (BEP-20 / BSC)', network: 'Binance Smart Chain', icon: Coins, color: 'from-amber-500 to-yellow-600', badge: 'Recomendado' },
  { value: 'MATIC_POLYGON', label: 'USDT (Polygon)', network: 'Polygon Network', icon: CircleDollarSign, color: 'from-purple-500 to-indigo-600', badge: 'Bajo Fee' },
  { value: 'BANK_US', label: 'Banco USA (ACH)', network: 'Transferencia ACH Directa', icon: Landmark, color: 'from-blue-500 to-cyan-600', badge: 'Cuentas EE.UU.' },
] as const;

const methodBadges: Record<string, string> = {
  USDT_BEP20: 'USDT BEP-20 (BSC)',
  MATIC_POLYGON: 'USDT Polygon',
  BANK_US: 'Banco USA (ACH)',
};

function accountSummary(a: any): string {
  if (a.method === 'BANK_US') {
    const d = a.details || {};
    return `${d.bankName || 'Banco USA'} · ${d.accountHolder || ''} · Routing ${d.routingNumber || ''} · Cta ${d.accountNumber || ''}`.trim().replace(/^ · | · $/g, '');
  }
  return `${methodBadges[a.method] || a.method} · ${maskAddress(a.address || '')}`;
}

function accountBadge(m: string): string {
  return methodBadges[m] || m;
}

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

export function EarningsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'wallet';

  const { status, fetchStatus } = useMembershipStore();
  const [earnings, setEarnings] = useState<any>({ balance: 0, totalEarned: 0, pendingApproval: 0, retainedTotal: 0, commissions: [], retained: [] });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<'USDT_BEP20' | 'MATIC_POLYGON' | 'BANK_US'>('USDT_BEP20');
  const [address, setAddress] = useState('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountHolder: '', routingNumber: '', accountNumber: '' });
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('new');
  const [saveAccount, setSaveAccount] = useState(false);
  const [confirmData, setConfirmData] = useState<any>(null);

  // Filtros de comisiones
  const [commissionSearch, setCommissionSearch] = useState('');
  const [commissionLevelFilter, setCommissionLevelFilter] = useState<'ALL' | '1' | '2'>('ALL');

  // Filtros de retiros
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Simulador de Fee & Retiro
  const [simAmount, setSimAmount] = useState<number>(100);
  const [simFeePercent, setSimFeePercent] = useState<number>(0);

  useEffect(() => {
    load();
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [earnRes, wdRes, acctRes] = await Promise.all([membershipApi.earnings(), membershipApi.withdrawals(), membershipApi.payoutAccounts()]);
      setEarnings(earnRes.data);
      setWithdrawals(wdRes.data.withdrawals || []);
      setAccounts(acctRes.data.accounts || []);
      if (earnRes.data.balance > 0) {
        setSimAmount(Math.min(Math.max(earnRes.data.balance, 50), 500));
      }
      await fetchStatus();
    } catch (e: any) {
      if (!silent) toast.error(e.response?.data?.error || 'Error al cargar tus ganancias');
    } finally {
      setLoading(false);
    }
  };

  const hasPending = withdrawals.some(w => w.status === 'PENDING');

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const setPresetPercent = (pct: number) => {
    const bal = earnings.balance ?? 0;
    if (bal <= 0) return;
    const calc = (bal * pct) / 100;
    setAmount(calc.toFixed(2));
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (value > (earnings.balance ?? 0)) {
      toast.error('El monto no puede exceder tu saldo disponible');
      return;
    }

    const selected = accounts.find(a => a.id === selectedAccountId);
    const useSaved = selectedAccountId !== 'new' && selected;

    const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
    let error: string | null = null;
    if (!useSaved) {
      if (method === 'USDT_BEP20' || method === 'MATIC_POLYGON') {
        if (!address.trim()) error = 'Ingresa la dirección de tu wallet.';
        else if (!ADDRESS_RE.test(address.trim())) {
          error = `La dirección de ${method === 'USDT_BEP20' ? 'USDT (BEP-20)' : 'USDT (Polygon)'} no es válida. Debe iniciar con 0x y tener 42 caracteres.`;
        }
      } else {
        if (!bankDetails.bankName.trim()) error = 'El nombre del banco es obligatorio.';
        else if (!bankDetails.accountHolder.trim()) error = 'El titular de la cuenta es obligatorio.';
        else if (!/^\d{9}$/.test(bankDetails.routingNumber.trim())) error = 'El número de routing debe ser de exactamente 9 dígitos.';
        else if (bankDetails.accountNumber.trim().length < 4 || bankDetails.accountNumber.trim().length > 17) error = 'El número de cuenta debe tener entre 4 y 17 dígitos.';
      }
    }
    setFieldError(error);
    if (error) return;

    const finalMethod = useSaved ? selected.method : method;
    const finalAccount = useSaved ? selected.address : (method === 'BANK_US' ? undefined : address.trim());
    const finalDetails = useSaved ? selected.details : (method === 'BANK_US' ? bankDetails : undefined);

    setConfirmData({ value, finalMethod, finalAccount, finalDetails, useSaved });
  };

  const executeWithdraw = async () => {
    if (!confirmData) return;
    const { value, finalMethod, finalAccount, finalDetails, useSaved } = confirmData;
    setSubmitting(true);
    try {
      await membershipApi.requestWithdrawal({ amount: value, method: finalMethod, account: finalAccount, details: finalDetails });

      if (!useSaved && saveAccount) {
        await membershipApi.savePayoutAccount({
          method,
          address: method === 'BANK_US' ? undefined : address.trim(),
          details: method === 'BANK_US' ? bankDetails : undefined,
        });
      }

      toast.success('¡Solicitud de retiro enviada con éxito! Pendiente de aprobación.');
      setAmount('');
      setAddress('');
      setBankDetails({ bankName: '', accountHolder: '', routingNumber: '', accountNumber: '' });
      setConfirmData(null);
      await load(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al solicitar retiro');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de comisiones
  const filteredCommissions = (earnings.commissions || []).filter((c: any) => {
    const term = commissionSearch.toLowerCase().trim();
    const matchesSearch = term === '' ||
      c.sourceUser?.firstName?.toLowerCase().includes(term) ||
      c.sourceUser?.lastName?.toLowerCase().includes(term) ||
      c.sourceUser?.username?.toLowerCase().includes(term) ||
      String(c.amount).includes(term);

    const matchesLevel = commissionLevelFilter === 'ALL' || String(c.level) === commissionLevelFilter;
    return matchesSearch && matchesLevel;
  });

  // Filtrado de retiros
  const filteredWithdrawals = withdrawals.filter((w: any) => {
    const term = withdrawalSearch.toLowerCase().trim();
    const matchesSearch = term === '' ||
      String(w.amount).includes(term) ||
      w.method?.toLowerCase().includes(term);

    const matchesStatus = withdrawalStatusFilter === 'ALL' || w.status === withdrawalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = accounts.find(a => a.id === selectedAccountId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin" />
          <Wallet className="w-5 h-5 absolute inset-0 m-auto text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-dark-400">Cargando Billetera & Ganancias...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'wallet', label: 'Billetera & Retiro', icon: Wallet, count: fmt(earnings.balance ?? 0), color: 'from-amber-500 to-orange-600' },
    { id: 'commissions', label: 'Comisiones', icon: TrendingUp, count: String(earnings.commissions?.length || 0), color: 'from-emerald-500 to-teal-600' },
    { id: 'accounts', label: 'Cuentas de Cobro', icon: Landmark, count: String(accounts.length), color: 'from-blue-500 to-indigo-600' },
    { id: 'withdrawals', label: 'Historial Retiros', icon: History, count: String(withdrawals.length), color: 'from-purple-500 to-fuchsia-600' },
    { id: 'calculator', label: 'Calculadora Fee', icon: Calculator, count: 'Simulador', color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Billetera & Ganancias"
        subtitle="Monitorea tus comisiones generadas por tu red, administra tus cuentas de cobro y solicita retiros en USDT o Banco USA."
        icon={Wallet}
      />

      {/* Hero Card Visual Estilo Crypto Wallet / Treasury */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-5 sm:p-7 border border-white/10 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Billetera Principal · Círculo 1</span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Saldo Disponible para Retiro</p>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
                {fmt(earnings.balance ?? 0)}
              </h1>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Saldo acumulado por ventas directas e indirectas de tu red y comisiones automáticas de TikTok Shop.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setTab('wallet')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-black shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Solicitar Retiro Ahora</span>
            </button>

            <button
              onClick={() => load(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Balance</span>
            </button>
          </div>
        </div>

        {/* 3 Métricas en el Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Total Ganado de por Vida</p>
            <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">{fmt(earnings.totalEarned ?? 0)}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Comisiones en Proceso</p>
            <p className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">{fmt(earnings.pendingApproval ?? 0)}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Retiros Realizados</p>
            <p className="text-lg sm:text-xl font-black text-white mt-0.5">{withdrawals.length} solicitudes</p>
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
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-200/80 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: Billetera & Solicitud de Retiro ─── */}
      {currentTab === 'wallet' && (
        <div className="space-y-6 animate-fade-in">
          {/* Card Principal de Retiro */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-dark-700">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-500" />
                  <span>Solicitar Retiro de Fondos</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Elige el monto y el método de cobro preferido (Cripto USDT o Transferencia Bancaria USA).
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                Saldo: {fmt(earnings.balance ?? 0)}
              </div>
            </div>

            {hasPending ? (
              <div className="flex items-start gap-3.5 p-4 sm:p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Tienes una solicitud de retiro en proceso</p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                    Tu solicitud está siendo revisada y procesada por el equipo de administración. Podrás solicitar un nuevo retiro una vez completada.
                  </p>
                  <button
                    onClick={() => setTab('withdrawals')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline mt-2"
                  >
                    <span>Ver estado en el historial de retiros</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-6">
                {/* Monto & Presets */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <Label htmlFor="withdraw-amount" className="font-bold text-gray-700 dark:text-dark-200">
                      Monto a retirar (USD)
                    </Label>
                    <span className="text-gray-400">Mínimo sugerido: $10.00</span>
                  </div>

                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="withdraw-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="pl-10 text-base sm:text-lg font-bold h-12 rounded-2xl"
                    />
                  </div>

                  {/* Botones de Porcentaje Rápido */}
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { label: '25%', val: 25 },
                      { label: '50%', val: 50 },
                      { label: '75%', val: 75 },
                      { label: 'MAX (100%)', val: 100 },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setPresetPercent(btn.val)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selección de Cuenta Guardada vs Nueva */}
                {accounts.length > 0 && (
                  <div className="space-y-2.5">
                    <Label className="font-bold text-gray-700 dark:text-dark-200">Elige la cuenta de cobro</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        className={clsx(
                          'flex items-center gap-3 rounded-2xl border-2 p-3.5 cursor-pointer transition-all',
                          selectedAccountId === 'new'
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/15 shadow-xs'
                            : 'border-gray-100 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 bg-white dark:bg-dark-800'
                        )}
                      >
                        <input
                          type="radio"
                          name="payout-account"
                          className="accent-amber-500"
                          checked={selectedAccountId === 'new'}
                          onChange={() => setSelectedAccountId('new')}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-dark-100">Ingresar una cuenta nueva</p>
                          <p className="text-[11px] text-gray-500 dark:text-dark-400 truncate">Configurar dirección o banco abajo</p>
                        </div>
                      </label>

                      {accounts.map(a => (
                        <div
                          key={a.id}
                          className={clsx(
                            'flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all relative group',
                            selectedAccountId === a.id
                              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/15 shadow-xs'
                              : 'border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800'
                          )}
                        >
                          <input
                            type="radio"
                            name="payout-account"
                            className="accent-amber-500"
                            checked={selectedAccountId === a.id}
                            onChange={() => setSelectedAccountId(a.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-dark-100 truncate">
                              {accountBadge(a.method)}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-dark-400 truncate font-mono">{accountSummary(a)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await membershipApi.deletePayoutAccount(a.id);
                                setAccounts(accounts.filter(x => x.id !== a.id));
                                if (selectedAccountId === a.id) setSelectedAccountId('new');
                                toast.success('Cuenta eliminada');
                              } catch {
                                toast.error('Error al eliminar');
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selector de Método para Cuenta Nueva */}
                {selectedAccountId === 'new' && (
                  <div className="space-y-3">
                    <Label className="font-bold text-gray-700 dark:text-dark-200">Método de Retiro</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {methodOptions.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = method === opt.value;
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => setMethod(opt.value)}
                            className={clsx(
                              'relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all',
                              isSelected
                                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-900/20 text-gray-900 dark:text-white shadow-xs'
                                : 'border-gray-100 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-dark-300'
                            )}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${opt.color} text-white flex items-center justify-center`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300">
                                {opt.badge}
                              </span>
                            </div>
                            <span className="font-bold text-xs sm:text-sm">{opt.label}</span>
                            <span className="text-[11px] text-gray-400 dark:text-dark-500 mt-0.5">{opt.network}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Formulario de Datos para Cripto o Banco */}
                {selectedAccountId === 'new' && (method === 'USDT_BEP20' || method === 'MATIC_POLYGON') ? (
                  <div className="space-y-2 p-4 rounded-2xl bg-gray-50/70 dark:bg-dark-900/40 border border-gray-100 dark:border-dark-700">
                    <Label htmlFor="withdraw-address" className="text-xs font-bold text-gray-700 dark:text-dark-200">
                      Dirección de Wallet {method === 'USDT_BEP20' ? 'USDT (Red BEP-20 / BSC)' : 'USDT (Red Polygon)'}
                    </Label>
                    <Input
                      id="withdraw-address"
                      placeholder="0x..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="font-mono text-xs sm:text-sm h-11"
                    />
                    <div className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-dark-400 mt-1">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>Solo envía a wallets compatibles con <strong>{method === 'USDT_BEP20' ? 'BEP-20 (BNB Smart Chain)' : 'Polygon'}</strong>. Fondos enviados a otra red podrían extraviarse.</span>
                    </div>
                  </div>
                ) : selectedAccountId === 'new' ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-dark-900/40 border border-gray-100 dark:border-dark-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bank-name" className="text-xs font-bold">Nombre del Banco</Label>
                        <Input id="bank-name" placeholder="Ej. Chase, Bank of America" value={bankDetails.bankName} onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="bank-holder" className="text-xs font-bold">Titular de la Cuenta</Label>
                        <Input id="bank-holder" placeholder="Nombre completo del titular" value={bankDetails.accountHolder} onChange={e => setBankDetails({ ...bankDetails, accountHolder: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bank-routing" className="text-xs font-bold">Routing Number (9 dígitos)</Label>
                        <Input id="bank-routing" inputMode="numeric" placeholder="000000000" maxLength={9} value={bankDetails.routingNumber} onChange={e => setBankDetails({ ...bankDetails, routingNumber: e.target.value.replace(/\D/g, '') })} />
                      </div>
                      <div>
                        <Label htmlFor="bank-account" className="text-xs font-bold">Número de Cuenta</Label>
                        <Input id="bank-account" inputMode="numeric" placeholder="Número de cuenta bancaria" maxLength={17} value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Cuenta guardada seleccionada:</p>
                      <p className="text-xs text-gray-700 dark:text-dark-200 truncate mt-0.5 font-mono">{accountSummary(selected)}</p>
                    </div>
                  </div>
                )}

                {selectedAccountId === 'new' && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 dark:text-dark-300">
                    <input
                      type="checkbox"
                      className="accent-amber-500 rounded"
                      checked={saveAccount}
                      onChange={e => setSaveAccount(e.target.checked)}
                    />
                    <span>Guardar esta cuenta de cobro para futuros retiros</span>
                  </label>
                )}

                {fieldError && (
                  <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{fieldError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (earnings.balance ?? 0) <= 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Continuar y Confirmar Retiro</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Historial de Comisiones ─── */}
      {currentTab === 'commissions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Historial de Comisiones Recibidas</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Desglose de comisiones acreditadas por membresías y renovaciones de tu red
                </p>
              </div>

              {/* Filtros de Nivel */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Todos los niveles' },
                  { id: '1', label: 'Nivel 1 (Directos)' },
                  { id: '2', label: 'Nivel 2 (Indirectos)' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setCommissionLevelFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      commissionLevelFilter === chip.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Comisiones */}
            <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 border-b border-gray-100 dark:border-dark-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar comisión por nombre de usuario, referido o monto..."
                  value={commissionSearch}
                  onChange={e => setCommissionSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {commissionSearch && (
                  <button
                    onClick={() => setCommissionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Feed de Comisiones */}
            {filteredCommissions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <TrendingUp className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">No hay comisiones para mostrar</p>
                <p className="text-xs text-gray-400 mt-1">Invita miembros a tu red para empezar a generar ganancias automáticas.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {filteredCommissions.map((c: any) => {
                  const userName = c.sourceUser?.firstName
                    ? `${c.sourceUser.firstName} ${c.sourceUser?.lastName || ''}`.trim()
                    : c.sourceUser?.username || 'Miembro';

                  return (
                    <div key={c.id} className="p-4 sm:p-5 flex items-center gap-3.5 hover:bg-gray-50/70 dark:hover:bg-dark-750 transition-colors">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black shrink-0 shadow-xs ${
                        c.level === 1
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      }`}>
                        {(c.sourceUser?.firstName?.[0] || c.sourceUser?.username?.[0] || '?').toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                            {highlightMatch(userName, commissionSearch)}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.level === 1
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          }`}>
                            Nivel {c.level}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{c.percent}% sobre pago de {fmt(c.payment?.amount ?? 0)}
                        </p>
                      </div>

                      <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 ml-auto shrink-0 whitespace-nowrap">
                        +{fmt(c.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comisiones Perdidas (Si existen) */}
          {(earnings.retained?.length > 0) && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-red-200 dark:border-red-900/40 flex flex-wrap items-center justify-between gap-3 bg-red-50/50 dark:bg-red-900/10">
                <div>
                  <h3 className="font-bold text-base text-red-900 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>Comisiones Perdidas por Membresía Inactiva</span>
                  </h3>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                    Ocurrieron cuando tu cuota mensual no estaba al día. Mantén tu plan activo para no perder ingresos.
                  </p>
                </div>
                <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-xl">
                  Total retenido: {fmt(earnings.retainedTotal ?? 0)}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {earnings.retained.map((c: any) => (
                  <div key={c.id} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                      -
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-100 truncate">
                        Comisión Nivel {c.level} — {c.sourceUser?.firstName || c.sourceUser?.username || 'Miembro'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{c.percent}% sobre {fmt(c.payment?.amount ?? 0)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-red-500">-{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Mis Cuentas de Cobro ─── */}
      {currentTab === 'accounts' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-dark-700">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-blue-600" />
                  <span>Tus Cuentas de Cobro Registradas</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Billeteras de criptomonedas y cuentas bancarias guardadas para retiros en 1 toque.
                </p>
              </div>

              <button
                onClick={() => setTab('wallet')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Solicitar Retiro</span>
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Landmark className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">No tienes cuentas de cobro guardadas</p>
                <p className="text-xs text-gray-400 mt-1">Al solicitar tu primer retiro podrás marcar la casilla para guardarla.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(a => (
                  <div
                    key={a.id}
                    className="relative rounded-3xl border border-gray-100 dark:border-dark-700 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white p-5 space-y-4 shadow-md overflow-hidden group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-gray-300">{accountBadge(a.method)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await membershipApi.deletePayoutAccount(a.id);
                            setAccounts(accounts.filter(x => x.id !== a.id));
                            toast.success('Cuenta eliminada');
                          } catch {
                            toast.error('Error al eliminar');
                          }
                        }}
                        className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">Identificador de Cobro</p>
                      <p className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5 break-all">
                        {a.address || a.details?.accountNumber || 'Cuenta Guardada'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400 flex items-center justify-between">
                      <span>{a.method === 'BANK_US' ? a.details?.bankName : 'Red Verificada'}</span>
                      <span className="text-emerald-400 font-bold">Activa</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Historial de Retiros ─── */}
      {currentTab === 'withdrawals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  <span>Historial de Solicitudes de Retiro</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Estado en tiempo real de transferencias bancarias y envíos en USDT
                </p>
              </div>

              {/* Filtros de Estado */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'PENDING', label: 'Pendientes' },
                  { id: 'APPROVED', label: 'Aprobados' },
                  { id: 'REJECTED', label: 'Rechazados' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setWithdrawalStatusFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      withdrawalStatusFilter === chip.id
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Retiros */}
            <div className="p-4 bg-gray-50/50 dark:bg-dark-900/30 border-b border-gray-100 dark:border-dark-700">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar retiro por monto o método..."
                  value={withdrawalSearch}
                  onChange={e => setWithdrawalSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                {withdrawalSearch && (
                  <button
                    onClick={() => setWithdrawalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <History className="w-10 h-10 text-gray-300 dark:text-dark-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-dark-300">No hay retiros registrados</p>
                <p className="text-xs text-gray-400 mt-1">Tus solicitudes aparecerán aquí con su comprobante de pago.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-dark-700">
                {filteredWithdrawals.map((w: any) => {
                  const statusClasses: Record<string, { label: string; badge: string }> = {
                    PENDING: { label: 'En Revisión', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                    APPROVED: { label: 'Aprobado y Enviado', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                    REJECTED: { label: 'Rechazado', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                  };
                  const st = statusClasses[w.status] || statusClasses.PENDING;

                  return (
                    <div key={w.id} className="p-4 sm:p-5 flex items-center gap-3.5 hover:bg-gray-50/70 dark:hover:bg-dark-750 transition-colors">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-dark-100">
                          {fmt(w.amount)}
                          <span className="font-normal text-gray-500 dark:text-dark-400 text-xs ml-2">({accountBadge(w.method)})</span>
                        </p>
                        {w.feePercent > 0 && (
                          <p className="text-[11px] text-gray-500 dark:text-dark-400">
                            Fee {w.feePercent}% · Neto acreditado: {fmt(w.amount - (w.amount * w.feePercent) / 100)}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-dark-500 mt-0.5">
                          {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.badge} shrink-0`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Calculadora de Retiro & Fee ─── */}
      {currentTab === 'calculator' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-900 dark:text-dark-100">Simulador de Retiro & Recepción Neta</h2>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Calcula con precisión cuánto recibirás en tu cuenta</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">💵 Monto de Retiro Deseado</span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400 text-sm bg-cyan-50 dark:bg-cyan-900/30 px-2.5 py-0.5 rounded-lg">
                    {fmt(simAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 dark:text-dark-300">📊 Fee Administrativo / Red</span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-lg">
                    {simFeePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={simFeePercent}
                  onChange={e => setSimFeePercent(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 text-xs text-cyan-900 dark:text-cyan-200 leading-relaxed">
                💡 Los retiros en USDT BEP-20 y USDT Polygon tienen los fees de red más bajos y procesamientos ágiles.
              </div>
            </div>

            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Desglose del Retiro</span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 font-medium">Monto Neto a Recibir</p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                    {fmt(simAmount - (simAmount * simFeePercent) / 100)}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Monto Bruto Solicitado:</span>
                    <span className="font-bold text-white">{fmt(simAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Fee de Procesamiento ({simFeePercent}%):</span>
                    <span className="font-bold text-amber-400">-{fmt((simAmount * simFeePercent) / 100)}</span>
                  </div>
                </div>
              </div>

              <div className="relative pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setAmount(String(simAmount));
                    setTab('wallet');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Aplicar Monto y Solicitar Retiro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Confirmación de Retiro ─── */}
      <Dialog open={!!confirmData} onOpenChange={open => !open && setConfirmData(null)}>
        <DialogContent className="max-w-md dark:bg-dark-800 dark:border-dark-600 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-dark-100 text-base font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Confirmar Solicitud de Retiro
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 text-xs sm:text-sm py-2">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-700/50 border border-gray-100 dark:border-dark-600 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-400">Monto a retirar:</span>
                <span className="font-black text-gray-900 dark:text-dark-100 text-base">{confirmData && fmt(confirmData.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-400">Método:</span>
                <span className="font-bold text-gray-900 dark:text-dark-100">
                  {confirmData && accountBadge(confirmData.finalMethod)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-2 border-t border-gray-200/60 dark:border-dark-600">
                <span className="text-gray-500 dark:text-dark-400 shrink-0">Destino:</span>
                <span className="font-mono text-gray-900 dark:text-dark-100 text-right break-all">
                  {confirmData && confirmData.finalMethod === 'BANK_US' ? (
                    <>{confirmData.finalDetails?.bankName} · {confirmData.finalDetails?.accountHolder}<br />
                      <span className="text-xs text-gray-500">Routing {confirmData.finalDetails?.routingNumber} · Cta {confirmData.finalDetails?.accountNumber}</span></>
                  ) : (
                    maskAddress(confirmData?.finalAccount || '')
                  )}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-dark-400 text-center leading-relaxed">
              Verifica que todos los datos sean correctos. Tu solicitud será auditada y enviada a la brevedad.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
            <Button
              onClick={() => setConfirmData(null)}
              disabled={submitting}
              className="border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200 w-full sm:w-auto rounded-2xl"
            >
              Cancelar
            </Button>
            <ButtonPrimary onClick={executeWithdraw} disabled={submitting} className="w-full sm:w-auto flex-1 rounded-2xl bg-amber-500 hover:bg-amber-600 shadow-amber-500/30">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirmar y Enviar</span>
            </ButtonPrimary>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
