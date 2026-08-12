import { useEffect, useState, useMemo } from 'react';
import { Wallet, CheckCircle, XCircle, Loader2, RefreshCw, Search } from 'lucide-react';
import { adminBusinessApi } from '@/services/api';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

const statusWithdrawal: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  REJECTED: { label: 'Rechazado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const methodLabel = (m: string) =>
  ({ USDT_BEP20: 'USDT BEP-20', MATIC_POLYGON: 'USDT Polygon', BANK_US: 'Banco USA' } as Record<string, string>)[m] || m;

const netAmount = (w: any, feeInput?: string) => {
  const fee = Number(feeInput && feeInput !== '' ? feeInput : w.feePercent > 0 ? w.feePercent : 4);
  return Math.round((w.amount - (w.amount * fee) / 100) * 100) / 100;
};

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [withdrawalFees, setWithdrawalFees] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const wRes = await adminBusinessApi.withdrawals();
      setWithdrawals(wRes.data.withdrawals);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar los retiros');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        const fee = Number(withdrawalFees[id] && withdrawalFees[id] !== '' ? withdrawalFees[id] : 4);
        if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
          toast.error('El fee de retiro debe estar entre 0 y 100%');
          return;
        }
        await adminBusinessApi.approveWithdrawal(id, { feePercent: fee });
        toast.success(`Retiro aprobado: saldo debitado (fee ${fee}%)`);
      } else {
        await adminBusinessApi.rejectWithdrawal(id);
        toast.success('Retiro rechazado');
      }
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al procesar');
    } finally {
      setProcessingId(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withdrawals.filter(w => {
      const name = `${w.user?.firstName || ''} ${w.user?.lastName || ''} ${w.user?.username || ''}`.toLowerCase();
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && w.method !== methodFilter) return false;
      if (q && !name.includes(q)) return false;
      return true;
    });
  }, [withdrawals, query, statusFilter, methodFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Retiros</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Solicitudes de retiro de los franquiciados</p>
        </div>
        <Button onClick={load} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-400">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingWithdrawals}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-400">Monto pendiente</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-100 mt-1">
            {fmt(withdrawals.filter(w => w.status === 'PENDING').reduce((s, w) => s + w.amount, 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-dark-400">Total retirado</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {fmt(withdrawals.filter(w => w.status === 'APPROVED').reduce((s, w) => s + w.amount, 0))}
          </p>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Solicitudes de retiro
          </h2>
          {pendingWithdrawals > 0 && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
              {pendingWithdrawals} pendientes
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Estado: todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-3 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Método: todos</option>
            <option value="USDT_BEP20">USDT BEP-20</option>
            <option value="MATIC_POLYGON">USDT Polygon</option>
            <option value="BANK_US">Banco USA</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
            {withdrawals.length === 0 ? 'Sin retiros registrados' : 'Sin resultados para los filtros aplicados'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {filtered.map((w: any) => {
              const st = statusWithdrawal[w.status] || statusWithdrawal.PENDING;
              return (
                <div key={w.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold">
                    {(w.user?.firstName?.[0] || w.user?.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                      {w.user?.firstName || w.user?.username} {w.user?.lastName || ''}
                      {!w.user?.firstName && <span className="text-gray-400 font-normal"> ({w.user?.username})</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {fmt(w.amount)} · {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {w.feePercent > 0 && <span> · fee {w.feePercent}%</span>}
                    </p>
                    {w.method && (
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                        {methodLabel(w.method)}
                        {w.method === 'BANK_US' && w.details && (
                          <> · {w.details.bankName} · {w.details.accountHolder} · Routing {w.details.routingNumber} · Cta {w.details.accountNumber}</>
                        )}
                        {w.method !== 'BANK_US' && w.account && <> · {w.account}</>}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
                  {w.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={withdrawalFees[w.id] ?? 4}
                          onChange={e => setWithdrawalFees({ ...withdrawalFees, [w.id]: e.target.value })}
                          className="w-20 h-9 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-2 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          title="Fee de retiro (%)"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-dark-500 mt-0.5">fee %</span>
                      </div>
                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {fmt(netAmount(w, withdrawalFees[w.id]))}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-dark-500 mt-0.5">neto a pagar</span>
                      </div>
                      <Button size="sm" loading={processingId === w.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleWithdrawal(w.id, 'approve')}>
                        <CheckCircle className="w-4 h-4" /> Aprobar
                      </Button>
                      <Button size="sm" variant="danger" disabled={processingId === w.id}
                        className="bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleWithdrawal(w.id, 'reject')}>
                        <XCircle className="w-4 h-4" /> Rechazar
                      </Button>
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