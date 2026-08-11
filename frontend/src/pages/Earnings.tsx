import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Clock, Download, History, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { membershipApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { ButtonPrimary, Button, Input, Label, Card, CardContent } from '@/components/ui';
import { toast } from 'sonner';

export function EarningsPage() {
  const { status, fetchStatus } = useMembershipStore();
  const [earnings, setEarnings] = useState<any>({ balance: 0, totalEarned: 0, pendingApproval: 0, commissions: [] });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [earnRes, wdRes] = await Promise.all([membershipApi.earnings(), membershipApi.withdrawals()]);
      setEarnings(earnRes.data);
      setWithdrawals(wdRes.data.withdrawals);
      await fetchStatus();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar tus ganancias');
    } finally {
      setLoading(false);
    }
  };

  const hasPending = withdrawals.some(w => w.status === 'PENDING');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      await membershipApi.requestWithdrawal({ amount: value, method: 'manual' });
      toast.success('Solicitud de retiro enviada. Pendiente de aprobación.');
      setAmount('');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al solicitar retiro');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Saldo disponible', value: fmt(earnings.balance ?? 0), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total ganado', value: fmt(earnings.totalEarned ?? 0), icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Pendiente de pago', value: fmt(earnings.pendingApproval ?? 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Ganancias</h1>
        <p className="text-gray-500 dark:text-dark-400 mt-1">Tus comisiones y solicitudes de retiro</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-dark-100">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comisiones */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100">Historial de comisiones</h2>
        </div>
        {earnings.commissions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">
            Aún no tienes comisiones. Invita a tu red y gana con cada membresía.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {earnings.commissions.map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  c.level === 1 ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'
                }`}>
                  {(c.sourceUser?.firstName?.[0] || c.sourceUser?.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                    Comisión nivel {c.level} — {c.sourceUser?.firstName || c.sourceUser?.username || 'Miembro'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}· {c.percent}% sobre {fmt(c.payment?.amount ?? 0)}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitud de retiro */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 mb-4">Solicitar retiro</h2>
          {hasPending ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ya tienes una solicitud de retiro pendiente de aprobación. Podrás solicitar otra cuando sea aprobada o rechazada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">Monto a retirar (USD)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                  Saldo disponible: {fmt(earnings.balance ?? 0)}
                </p>
              </div>
              <ButtonPrimary type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Solicitar retiro
              </ButtonPrimary>
              <p className="text-xs text-gray-400 dark:text-dark-500 text-center">
                El retiro será procesado manualmente por el administrador.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Historial de retiros */}
      {withdrawals.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700">
            <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <History className="w-4 h-4" /> Historial de retiros
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {withdrawals.map((w: any) => {
              const statusClasses: Record<string, string> = {
                PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                APPROVED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                REJECTED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
              };
              return (
                <div key={w.id} className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-gray-300 dark:text-dark-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{fmt(w.amount)}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {new Date(w.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusClasses[w.status]}`}>
                    {w.status === 'PENDING' ? 'Pendiente' : w.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
