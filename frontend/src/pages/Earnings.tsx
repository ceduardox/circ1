import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Clock, Download, History, AlertCircle, Loader2, Landmark, CircleDollarSign, Coins, Trash2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { membershipApi } from '@/services/api';
import { useMembershipStore } from '@/store/membershipStore';
import { ButtonPrimary, Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { maskAddress } from '@/lib/utils';
import { toast } from 'sonner';

const methodOptions = [
  { value: 'USDT_BEP20', label: 'USDT BEP-20', icon: Coins },
  { value: 'MATIC_POLYGON', label: 'USDT Polygon', icon: CircleDollarSign },
  { value: 'BANK_US', label: 'Banco USA', icon: Landmark },
] as const;

const methodBadges: Record<string, string> = {
  USDT_BEP20: 'USDT BEP-20',
  MATIC_POLYGON: 'USDT Polygon',
  BANK_US: 'Banco USA',
};

function accountSummary(a: any): string {
  if (a.method === 'BANK_US') {
    const d = a.details || {};
    return `${d.bankName || ''} · ${d.accountHolder || ''} · Routing ${d.routingNumber || ''} · Cta ${d.accountNumber || ''}`.trim().replace(/^ · | · $/g, '');
  }
  return `${methodBadges[a.method] || a.method} · ${maskAddress(a.address || '')}`;
}

function accountBadge(m: string): string {
  return methodBadges[m] || m;
}

export function EarningsPage() {
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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [earnRes, wdRes, acctRes] = await Promise.all([membershipApi.earnings(), membershipApi.withdrawals(), membershipApi.payoutAccounts()]);
      setEarnings(earnRes.data);
      setWithdrawals(wdRes.data.withdrawals);
      setAccounts(acctRes.data.accounts || []);
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

    const selected = accounts.find(a => a.id === selectedAccountId);
    const useSaved = selectedAccountId !== 'new' && selected;

    const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
    let error: string | null = null;
    if (!useSaved) {
      if (method === 'USDT_BEP20' || method === 'MATIC_POLYGON') {
        if (!address.trim()) error = 'Ingresa la dirección de tu wallet.';
        else if (!ADDRESS_RE.test(address.trim())) {
          error = `La dirección de ${method === 'USDT_BEP20' ? 'USDT (BEP-20)' : 'USDT (Polygon)'} no es válida. Debe ser una dirección (0x + 40 caracteres hexadecimales).`;
        }
      } else {
        if (!bankDetails.bankName.trim()) error = 'El nombre del banco es obligatorio.';
        else if (!bankDetails.accountHolder.trim()) error = 'El titular de la cuenta es obligatorio.';
        else if (!/^\d{9}$/.test(bankDetails.routingNumber.trim())) error = 'El número de routing debe ser de 9 dígitos.';
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

      toast.success('Solicitud de retiro enviada. Pendiente de aprobación.');
      setAmount('');
      setAddress('');
      setBankDetails({ bankName: '', accountHolder: '', routingNumber: '', accountNumber: '' });
      setConfirmData(null);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al solicitar retiro');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const selected = accounts.find(a => a.id === selectedAccountId);

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

      {/* Comisiones perdidas (no estabas al día) */}
      {(earnings.retained?.length > 0) && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-red-200 dark:border-red-900/40 flex items-center justify-between bg-red-50 dark:bg-red-900/10">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" /> Comisiones perdidas
              </h2>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                Tu membresía no estaba al día (cuota mensual vencida) por lo que estas comisiones pasaron al sistema.
              </p>
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-xl">
              {fmt(earnings.retainedTotal ?? 0)}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {earnings.retained.map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                  {(c.sourceUser?.firstName?.[0] || c.sourceUser?.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                    Comisión nivel {c.level} perdida — {c.sourceUser?.firstName || c.sourceUser?.username || 'Miembro'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}· {c.percent}% sobre {fmt(c.payment?.amount ?? 0)} · podrías haber ganado esto.
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500 dark:text-red-400">-{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

              {accounts.length > 0 && (
                <div>
                  <Label>Cuenta de retiro</Label>
                  <div className="mt-1 space-y-2">
                    <label
                      className={clsx(
                        'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                        selectedAccountId === 'new'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-dark-700 hover:border-primary-300 bg-white dark:bg-dark-800'
                      )}
                    >
                      <input
                        type="radio"
                        name="payout-account"
                        className="accent-primary-600"
                        checked={selectedAccountId === 'new'}
                        onChange={() => { setSelectedAccountId('new'); }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-100">Usar una cuenta nueva</p>
                        <p className="text-xs text-gray-500 dark:text-dark-400">Escribe los datos abajo y guárdalos para después</p>
                      </div>
                    </label>
                    {accounts.map(a => (
                      <div
                        key={a.id}
                        className={clsx(
                          'flex items-center gap-3 rounded-xl border p-3 transition-all',
                          selectedAccountId === a.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800'
                        )}
                      >
                        <input
                          type="radio"
                          name="payout-account"
                          className="accent-primary-600"
                          checked={selectedAccountId === a.id}
                          onChange={() => setSelectedAccountId(a.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                            {accountBadge(a.method)}{a.label || accountSummary(a)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-400 truncate">{accountSummary(a)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await membershipApi.deletePayoutAccount(a.id);
                              setAccounts(accounts.filter(x => x.id !== a.id));
                              if (selectedAccountId === a.id) setSelectedAccountId('new');
                              toast.success('Cuenta eliminada');
                            } catch {
                              toast.error('Error al eliminar la cuenta');
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAccountId === 'new' && (
                <div>
                  <Label>Método de retiro</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                    {(methodOptions).map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setMethod(opt.value)}
                        className={clsx(
                          'flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-all',
                          method === opt.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                            : 'border-gray-200 dark:border-dark-700 text-gray-600 dark:text-dark-300 hover:border-primary-300 dark:hover:border-dark-500 bg-white dark:bg-dark-800'
                        )}
                      >
                        <opt.icon className="w-5 h-5" />
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAccountId === 'new' && (method === 'USDT_BEP20' || method === 'MATIC_POLYGON') ? (
                <div>
                  <Label htmlFor="withdraw-address">
                    Dirección de wallet ({method === 'USDT_BEP20' ? 'USDT BEP-20 / BNB' : 'USDT Polygon'})
                  </Label>
                  <Input
                    id="withdraw-address"
                    placeholder="0x..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                    Solo acepta USDT en la red {method === 'USDT_BEP20' ? 'BEP-20 (Binance Smart Chain)' : 'Polygon'}. Asegúrate de que tu wallet soporte esa red para no perder fondos.
                  </p>
                </div>
              ) : selectedAccountId === 'new' ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="bank-name">Nombre del banco</Label>
                    <Input id="bank-name" placeholder="Ej. Bank of America" value={bankDetails.bankName} onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="bank-holder">Titular de la cuenta</Label>
                    <Input id="bank-holder" placeholder="Nombre del titular" value={bankDetails.accountHolder} onChange={e => setBankDetails({ ...bankDetails, accountHolder: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="bank-routing">Routing number (9 dígitos)</Label>
                      <Input id="bank-routing" inputMode="numeric" placeholder="000000000" maxLength={9} value={bankDetails.routingNumber} onChange={e => setBankDetails({ ...bankDetails, routingNumber: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div>
                      <Label htmlFor="bank-account">Número de cuenta</Label>
                      <Input id="bank-account" inputMode="numeric" placeholder="Número de cuenta" maxLength={17} value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Cuenta bancaria en Estados Unidos. El retiro se hará por transferencia ACH.</p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Vas a recibir el pago en tu cuenta guardada:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-100 mt-1">{accountSummary(selected)}</p>
                </div>
              )}

              {selectedAccountId === 'new' && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-dark-300">
                  <input
                    type="checkbox"
                    className="accent-primary-600"
                    checked={saveAccount}
                    onChange={e => setSaveAccount(e.target.checked)}
                  />
                  Guardar esta cuenta para los próximos retiros
                </label>
              )}

              {fieldError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{fieldError}</span>
                </div>
              )}

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
                  <Download className="w-4 h-4 text-gray-300 dark:text-dark-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{fmt(w.amount)}</p>
                    {w.feePercent > 0 && (
                      <p className="text-xs text-gray-500 dark:text-dark-400">
                        Fee de retiro {w.feePercent}% · te llegan {fmt(w.amount - (w.amount * w.feePercent) / 100)}
                      </p>
                    )}
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

      {/* Confirmación de retiro */}
      <Dialog open={!!confirmData} onOpenChange={open => !open && setConfirmData(null)}>
        <DialogContent className="max-w-md dark:bg-dark-800 dark:border-dark-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-dark-100">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirmar retiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-700/50 border border-gray-100 dark:border-dark-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-400">Monto</span>
                <span className="font-bold text-gray-900 dark:text-dark-100">{confirmData && fmt(confirmData.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-dark-400">Método</span>
                <span className="font-medium text-gray-900 dark:text-dark-100">
                  {confirmData && (confirmData.finalMethod === 'BANK_US' ? 'Banco USA' : confirmData.finalMethod === 'USDT_BEP20' ? 'USDT BEP-20' : 'USDT Polygon')}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-dark-400 flex-shrink-0">Recibirás</span>
                <span className="font-medium text-gray-900 dark:text-dark-100 text-right">
                  {confirmData && confirmData.finalMethod === 'BANK_US' ? (
                    <>{confirmData.finalDetails?.bankName} · {confirmData.finalDetails?.accountHolder}<br />
                      <span className="text-xs text-gray-500">Routing {confirmData.finalDetails?.routingNumber} · Cta {confirmData.finalDetails?.accountNumber}</span></>
                  ) : (
                    <span className="font-mono break-all">{maskAddress(confirmData?.finalAccount || '')}</span>
                  )}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
              Verifica que los datos sean correctos. Este retiro será procesado manualmente por el administrador.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <Button
              onClick={() => setConfirmData(null)}
              disabled={submitting}
              className="border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <ButtonPrimary onClick={executeWithdraw} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar y enviar
            </ButtonPrimary>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
