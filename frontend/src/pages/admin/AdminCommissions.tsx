import { useEffect, useState } from 'react';
import {
  Settings2, DollarSign, CheckCircle, XCircle, Loader2, Wallet, RefreshCw, UserCheck, Ban,
} from 'lucide-react';
import { adminBusinessApi } from '@/services/api';
import { Input, Label, Card, CardContent, ButtonPrimary, Button } from '@/components/ui';
import { toast } from 'sonner';

const statusPayment: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  REJECTED: { label: 'Rechazado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const statusWithdrawal: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  REJECTED: { label: 'Rechazado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export function AdminCommissionsPage() {
  const [settings, setSettings] = useState<any>({ membershipPrice: 500, monthlyFee: 50, level1Percent: 25, level2Percent: 5 });
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [sRes, pRes, wRes] = await Promise.all([
        adminBusinessApi.settings(),
        adminBusinessApi.payments(),
        adminBusinessApi.withdrawals(),
      ]);
      setSettings(sRes.data);
      setPayments(pRes.data.payments);
      setWithdrawals(wRes.data.withdrawals);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await adminBusinessApi.updateSettings(settings);
      setSettings(res.data);
      toast.success('Configuración actualizada');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        await adminBusinessApi.approvePayment(id);
        toast.success('Pago aprobado: membresía activada y comisiones generadas');
      } else {
        await adminBusinessApi.rejectPayment(id);
        toast.success('Pago rechazado');
      }
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al procesar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        await adminBusinessApi.approveWithdrawal(id);
        toast.success('Retiro aprobado: saldo debitado');
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

  const handleDeactivate = async (payment: any) => {
    const name = payment.user?.firstName || payment.user?.username || 'este usuario';
    if (!confirm(`¿Desactivar la membresía de ${name}? Se revierten las comisiones generadas por este pago, como si no hubiera pagado.`)) return;
    setProcessingId(payment.id);
    try {
      await adminBusinessApi.deactivatePayment(payment.id);
      toast.success('Membresía desactivada: revierte comisiones');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al desactivar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = async (payment: any) => {
    setProcessingId(payment.id);
    try {
      const { data } = await adminBusinessApi.verifyPayment(payment.id);
      if (data.activated) {
        toast.success(`Pago confirmado por NowPayments (${data.npStatus}): membresía activada`);
      } else {
        toast.info(`NowPayments reporta estado: ${data.npStatus}. Sigue sin confirmar.`);
      }
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al verificar');
    } finally {
      setProcessingId(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING').length;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Comisiones y Pagos</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Configuración y aprobación del negocio</p>
        </div>
        <Button onClick={load} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {/* Settings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Settings2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-100">Configuración del negocio</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mprice">Precio membresía (USD)</Label>
              <Input id="mprice" type="number" value={settings.membershipPrice} min={0}
                onChange={e => setSettings({ ...settings, membershipPrice: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="mfee">Cuota mensual (USD)</Label>
              <Input id="mfee" type="number" value={settings.monthlyFee} min={0}
                onChange={e => setSettings({ ...settings, monthlyFee: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="l1">Comisión nivel 1 (%)</Label>
              <Input id="l1" type="number" value={settings.level1Percent} min={0} max={100}
                onChange={e => setSettings({ ...settings, level1Percent: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="l2">Comisión nivel 2 (%)</Label>
              <Input id="l2" type="number" value={settings.level2Percent} min={0} max={100}
                onChange={e => setSettings({ ...settings, level2Percent: Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-5">
            <ButtonPrimary onClick={handleSaveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Guardar configuración
            </ButtonPrimary>
          </div>
        </CardContent>
      </Card>

      {/* Pagos de membresía */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100">Pagos de membresía</h2>
          {pendingPayments > 0 && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
              {pendingPayments} pendientes
            </span>
          )}
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">Sin pagos registrados</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {payments.map((p: any) => {
              const st = statusPayment[p.status] || statusPayment.PENDING;
              return (
                <div key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                    {(p.user?.firstName?.[0] || p.user?.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                      {p.user?.firstName || p.user?.username} {p.user?.lastName || ''}
                      {!p.user?.firstName && <span className="text-gray-400 font-normal"> ({p.user?.username})</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {fmt(p.amount)} · {new Date(p.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {p.method === 'nowpayments' && p.npStatus && (
                      <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5 capitalize">
                        NowPayments · {p.npStatus}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
                  {p.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      {p.method === 'nowpayments' && (
                        <Button size="sm" loading={processingId === p.id}
                          className="bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={() => handleVerify(p)}>
                          <RefreshCw className="w-4 h-4" /> Verificar
                        </Button>
                      )}
                      <Button size="sm" loading={processingId === p.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handlePayment(p.id, 'approve')}>
                        <CheckCircle className="w-4 h-4" /> Aprobar
                      </Button>
                      <Button size="sm" variant="danger" disabled={processingId === p.id}
                        className="bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handlePayment(p.id, 'reject')}>
                        <XCircle className="w-4 h-4" /> Rechazar
                      </Button>
                    </div>
                  )}
                  {p.status === 'APPROVED' && (
                    <Button size="sm" disabled={processingId === p.id}
                      className="bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/40"
                      onClick={() => handleDeactivate(p)}>
                      {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Desactivar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retiros */}
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
        {withdrawals.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-500 text-sm">Sin retiros registrados</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {withdrawals.map((w: any) => {
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
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.classes}`}>{st.label}</span>
                  {w.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" loading={processingId === w.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleWithdrawal(w.id, 'approve')}>
                        <UserCheck className="w-4 h-4" /> Aprobar
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
