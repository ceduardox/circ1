import { useEffect, useState } from 'react';
import { Settings2, DollarSign, CheckCircle, XCircle, Loader2, RefreshCw, Ban } from 'lucide-react';
import { adminBusinessApi } from '@/services/api';
import { Input, Label, Card, CardContent, ButtonPrimary, Button } from '@/components/ui';
import { toast } from 'sonner';

const statusPayment: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  REJECTED: { label: 'Rechazado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export function AdminCommissionsPage() {
  const [settings, setSettings] = useState<any>({
    membershipPrice: 500, monthlyFee: 50, level1Percent: 25, level2Percent: 5,
    plans: [
      { id: 'estandar', name: 'Estándar', price: 500 },
      { id: 'elite', name: 'Élite', price: 1000 },
    ],
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [retained, setRetained] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [sRes, pRes, rRes] = await Promise.all([
        adminBusinessApi.settings(),
        adminBusinessApi.payments(),
        adminBusinessApi.retained(),
      ]);
      setSettings(sRes.data);
      setPayments(pRes.data.payments);
      setRetained(rRes.data.retained || []);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="mt-6">
            <Label>Planes de membresía</Label>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 mb-3">
              El usuario elige el plan al activar su membresía. Las comisiones se calculan sobre el precio de cada plan.
            </p>
            <div className="space-y-2">
              {(settings.plans || []).map((pl: any, idx: number) => (
                <div key={pl.id} className="flex items-center gap-2">
                  <Input
                    value={pl.name}
                    placeholder="Nombre del plan"
                    className="flex-1"
                    onChange={e => {
                      const plans = [...settings.plans];
                      plans[idx] = { ...pl, name: e.target.value };
                      setSettings({ ...settings, plans });
                    }}
                  />
                  <Input
                    type="number"
                    value={pl.price}
                    min={0}
                    placeholder="Precio USD"
                    className="w-32"
                    onChange={e => {
                      const plans = [...settings.plans];
                      plans[idx] = { ...pl, price: Number(e.target.value) };
                      setSettings({ ...settings, plans });
                    }}
                  />
                  {settings.plans.length > 1 && (
                    <Button
                      size="sm"
                      variant="danger"
                      className="bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setSettings({ ...settings, plans: settings.plans.filter((_: any, i: number) => i !== idx) })}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              onClick={() => setSettings({
                ...settings,
                plans: [...settings.plans, { id: `plan-${Date.now()}`, name: '', price: 0 }],
              })}
            >
              + Añadir plan
            </button>
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
                    {p.planName && (
                      <p className="text-[11px] text-primary-600 dark:text-primary-400 mt-0.5">
                        Plan {p.planName}
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

      {/* Comisiones retenidas por el sistema */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Comisiones retenidas por el sistema
            </h2>
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
              Franquiciados que no estaban al día con su cuota y perdieron su comisión.
            </p>
          </div>
          {retained.length > 0 && (
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl">
              {fmt(retained.reduce((s, c) => s + c.amount, 0))}
            </span>
          )}
        </div>
        {retained.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-500 text-sm">
            Sin comisiones retenidas. Todos los referidores están al día.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {retained.map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                  {(c.user?.firstName?.[0] || c.user?.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                    {c.user?.firstName || c.user?.username} {c.user?.lastName || ''} — Nivel {c.level}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    Perdió {fmt(c.amount)} ({c.percent}% sobre {fmt(c.payment?.amount ?? 0)}) por no estar al día.
                    Origen: {c.sourceUser?.firstName || c.sourceUser?.username || 'Miembro'}
                    {' '}· {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">-{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
