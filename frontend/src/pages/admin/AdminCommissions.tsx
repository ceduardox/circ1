import { useEffect, useState } from 'react';
import { Settings2, DollarSign, CheckCircle, XCircle, Loader2, RefreshCw, Ban } from 'lucide-react';
import { adminBusinessApi } from '@/services/api';
import { Input, Label, Card, CardContent, ButtonPrimary, Button, PageHeader } from '@/components/ui';
import { toast } from 'sonner';

const statusPayment: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  APPROVED: { label: 'Aprobado', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  REJECTED: { label: 'Rechazado', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

export function AdminCommissionsPage() {
  const [settings, setSettings] = useState<any>({
    membershipPrice: 500, monthlyFee: 50, level1Percent: 25, level2Percent: 5, registerOpen: true,
    plans: [
      { id: 'estandar', name: 'Estándar', price: 500, tiktok: true },
      { id: 'elite', name: 'Élite', price: 1000, tiktok: true },
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
      <PageHeader
        title="Comisiones y Pagos"
        subtitle="Configuración y aprobación del negocio"
        icon={Settings2}
        action={<Button onClick={load} className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>}
      />

      {/* Settings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Settings2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-100">Configuración del negocio</h2>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-1">Comisiones por referido</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Porcentaje que gana el referidor cuando su invitado paga un pack.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="l1">Comisión nivel 1 (%)</Label>
                <Input id="l1" type="number" value={settings.level1Percent} min={0} max={100} placeholder="Ej: 25"
                  onChange={e => setSettings({ ...settings, level1Percent: Number(e.target.value) })} />
                <p className="text-[11px] text-gray-400 mt-1">Directo (quien invitó)</p>
              </div>
              <div>
                <Label htmlFor="l2">Comisión nivel 2 (%)</Label>
                <Input id="l2" type="number" value={settings.level2Percent} min={0} max={100} placeholder="Ej: 5"
                  onChange={e => setSettings({ ...settings, level2Percent: Number(e.target.value) })} />
                <p className="text-[11px] text-gray-400 mt-1">Indirecto (abuelo)</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-1">Cuota mensual por defecto</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Se usa cuando un pack <b>no</b> tiene cuota propia (abajo). Si todos los packs tienen su cuota, este valor no se usa.</p>
            <div className="max-w-xs">
              <Label htmlFor="mfee">Cuota mensual global (USD)</Label>
              <Input id="mfee" type="number" value={settings.monthlyFee} min={0} placeholder="Ej: 50"
                onChange={e => setSettings({ ...settings, monthlyFee: Number(e.target.value) })} />
              <p className="text-[11px] text-gray-400 mt-1">Fallback: planes sin cuota propia usan este valor</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-dark-600 p-4 bg-gray-50 dark:bg-dark-700/40">
            <div>
              <Label>Registro por fuera (login)</Label>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                Si está apagado, solo se pueden registrar con un link de invitación.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.registerOpen;
                setSettings({ ...settings, registerOpen: next });
              }}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
                settings.registerOpen === false ? 'bg-gray-300 dark:bg-dark-600' : 'bg-emerald-500'
              }`}
              aria-pressed={settings.registerOpen !== false}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${settings.registerOpen === false ? 'left-1' : 'left-7'}`} />
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-1">Biblioteca de apps (reutilizable)</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">Guarda apps con nombre, logo y link. Luego las seleccionas en cada pack con un click.</p>
            <div className="space-y-2 mb-4">
              {(settings.appLibrary || []).map((app: any, idx: number) => (
                <div key={app.id} className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-2">
                  <Input value={app.name} placeholder="Nombre app" className="flex-1" onChange={e => { const lib=[...(settings.appLibrary||[])]; lib[idx]={...app, name:e.target.value}; setSettings({...settings, appLibrary: lib}); }} />
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={app.logo || ''} placeholder="Logo URL" className="flex-1" onChange={e => { const lib=[...(settings.appLibrary||[])]; lib[idx]={...app, logo:e.target.value}; setSettings({...settings, appLibrary: lib}); }} />
                    <label className="shrink-0 px-2 py-1.5 rounded-lg border bg-white text-xs cursor-pointer hover:bg-gray-50">Subir<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return; const fd=new FormData(); fd.append('file',file); try{ const {data}=await import('@/services/api').then(m=>m.api.post('/admin/upload/app-logo',fd,{headers:{'Content-Type':'multipart/form-data'}})); const lib=[...(settings.appLibrary||[])]; lib[idx]={...app, logo:data.url}; setSettings({...settings, appLibrary: lib}); toast.success('Logo subido'); }catch(err:any){ toast.error(err.response?.data?.error||'Error'); } (e.target as HTMLInputElement).value=''; }} /></label>
                    {app.logo && <img src={app.logo} alt={app.name} className="w-6 h-6 rounded object-cover border" />}
                  </div>
                  <Input value={app.url || ''} placeholder="Link URL (opcional)" className="flex-1" onChange={e => { const lib=[...(settings.appLibrary||[])]; lib[idx]={...app, url:e.target.value}; setSettings({...settings, appLibrary: lib}); }} />
                  <button type="button" onClick={() => setSettings({...settings, appLibrary: (settings.appLibrary||[]).filter((_:any,i:number)=>i!==idx)})} className="text-xs text-red-600 hover:underline shrink-0">Quitar</button>
                </div>
              ))}
              <button type="button" onClick={() => setSettings({...settings, appLibrary: [...(settings.appLibrary||[]), { id:`app-${Date.now()}`, name:'', logo:'', url:'' }]})} className="text-xs text-primary-600 hover:underline">+ Añadir app a biblioteca</button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-1">Planes de membresía</h3>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">
              Cada pack define su precio, link de tarjeta, si incluye TikTok Shop, su ganancia diaria y su <b>cuota mensual propia</b> (si la dejas vacía, usa la global de arriba).
            </p>
            <div className="space-y-3">
              {(settings.plans || []).map((pl: any, idx: number) => (
                <div key={pl.id} className="flex flex-col gap-3 bg-gray-50 dark:bg-dark-700/40 border border-gray-200 dark:border-dark-600 rounded-xl p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-2">
                      <Input
                        value={pl.name}
                        placeholder="Nombre del plan"
                        className="flex-1 min-w-0"
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
                      className="w-full sm:w-28 shrink-0"
                      onChange={e => {
                        const plans = [...settings.plans];
                        plans[idx] = { ...pl, price: Number(e.target.value) };
                        setSettings({ ...settings, plans });
                      }}
                    />
                    <Input
                      type="number"
                      value={pl.monthlyFee ?? ''}
                      min={0}
                      placeholder={`Cuota (def. $${settings.monthlyFee})`}
                      title="Cuota mensual de este pack. Vacío = usa la global"
                      className="w-full sm:w-28 shrink-0"
                      onChange={e => {
                        const v = e.target.value === '' ? undefined : Number(e.target.value);
                        const plans = [...settings.plans];
                        plans[idx] = { ...pl, monthlyFee: v };
                        setSettings({ ...settings, plans });
                      }}
                    />
                    <Input
                      value={pl.whopUrl || ''}
                      placeholder="Link tarjeta (Whop)"
                      className="flex-1 min-w-0"
                      onChange={e => {
                        const plans = [...settings.plans];
                        plans[idx] = { ...pl, whopUrl: e.target.value };
                        setSettings({ ...settings, plans });
                      }}
                    />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-dark-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="accent-primary-600 w-4 h-4"
                          checked={pl.tiktok !== false}
                          onChange={e => {
                            const plans = [...settings.plans];
                            plans[idx] = { ...pl, tiktok: e.target.checked };
                            setSettings({ ...settings, plans });
                          }}
                        />
                        TikTok Shop
                      </label>
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-dark-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="accent-emerald-600 w-4 h-4"
                        checked={!!pl.dailyYield?.enabled}
                        onChange={e => {
                          const plans = [...settings.plans];
                          const cur = pl.dailyYield || { enabled: false, min: 0.1, max: 0.4 };
                          plans[idx] = { ...pl, dailyYield: e.target.checked ? { ...cur, enabled: true } : { ...cur, enabled: false } };
                          setSettings({ ...settings, plans });
                        }}
                      />
                      Ganancia diaria
                    </label>
                    {pl.dailyYield?.enabled && (
                      <div className="flex flex-col gap-3 w-full bg-white dark:bg-dark-800 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Rango diario y boost</p>
                          <button type="button" onClick={() => { const el=document.getElementById(`help-${pl.id}`); if(el) el.classList.toggle('hidden'); }} className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold hover:bg-emerald-200" title="Ver ayuda">?</button>
                        </div>
                        <div id={`help-${pl.id}`} className="hidden p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs leading-relaxed">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300">+ por referido:</p>
                          <p className="text-gray-600 dark:text-dark-300">Extra que se suma a su % base por cada referido directo <b>ACTIVE</b>. Ej: base 0.15% + 3 referidos × 0.02% = 0.21% ese día.</p>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300 mt-2">Tope boost:</p>
                          <p className="text-gray-600 dark:text-dark-300">Máximo extra acumulable. Ej: tope 0.10% → con 5 referidos ya no sube más (5×0.02=0.10). Con 10 seguiría en 0.10.</p>
                          <p className="text-gray-500 mt-2">Fórmula: <code className="bg-white dark:bg-dark-700 px-1 rounded">% final = random(min,max) + min(referidos×bonus, tope)</code></p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-600 dark:text-dark-300">% Mínimo / día</label>
                            <Input type="number" step="0.0001" min={0} max={5} value={pl.dailyYield.min} placeholder="0.1000" className="mt-1 w-full" onChange={e => { const plans=[...settings.plans]; plans[idx]={...pl, dailyYield:{...pl.dailyYield, min:Number(e.target.value)}}; setSettings({...settings, plans}); }} />
                            <p className="text-[10px] text-gray-400 mt-1">Ej: 0.0001 = 0.0001%</p>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-600 dark:text-dark-300">% Máximo / día</label>
                            <Input type="number" step="0.0001" min={0} max={5} value={pl.dailyYield.max} placeholder="0.4000" className="mt-1 w-full" onChange={e => { const plans=[...settings.plans]; plans[idx]={...pl, dailyYield:{...pl.dailyYield, max:Number(e.target.value)}}; setSettings({...settings, plans}); }} />
                            <p className="text-[10px] text-gray-400 mt-1">Ej: 0.4000 = 0.4000%</p>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-600 dark:text-dark-300">+ por referido</label>
                            <Input type="number" step="0.0001" min={0} max={5} value={pl.dailyYield.bonusPerReferral ?? 0.02} placeholder="0.0200" className="mt-1 w-full" onChange={e => { const plans=[...settings.plans]; plans[idx]={...pl, dailyYield:{...pl.dailyYield, bonusPerReferral:Number(e.target.value)}}; setSettings({...settings, plans}); }} />
                            <p className="text-[10px] text-gray-400 mt-1">Extra por cada directo activo</p>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-600 dark:text-dark-300">Tope boost</label>
                            <Input type="number" step="0.0001" min={0} max={5} value={pl.dailyYield.bonusCap ?? 0.1} placeholder="0.1000" className="mt-1 w-full" onChange={e => { const plans=[...settings.plans]; plans[idx]={...pl, dailyYield:{...pl.dailyYield, bonusCap:Number(e.target.value)}}; setSettings({...settings, plans}); }} />
                            <p className="text-[10px] text-gray-400 mt-1">Máximo acumulado</p>
                          </div>
                        </div>
                        {(() => {
                          const price = Number(pl.price) || 0;
                          const min = Number(pl.dailyYield.min) || 0;
                          const max = Number(pl.dailyYield.max) || 0;
                          const avg = (min + max) / 2;
                          const minDay = price * min / 100;
                          const maxDay = price * max / 100;
                          const avgDay = price * avg / 100;
                          const minMonth = minDay * 30;
                          const maxMonth = maxDay * 30;
                          const avgMonth = avgDay * 30;
                          return (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Calculadora: ${price} × {min}%-{max}%</p>
                              <p className="text-gray-600 dark:text-dark-300 mt-1">Por día: <b>${minDay.toFixed(2)} - ${maxDay.toFixed(2)}</b> · Promedio <b>${avgDay.toFixed(2)}/día</b></p>
                              <p className="text-gray-600 dark:text-dark-300">Al mes (30d): <b>${minMonth.toFixed(2)} - ${maxMonth.toFixed(2)}</b> · Promedio <b>${avgMonth.toFixed(2)}/mes</b></p>
                            </div>
                          );
                        })()}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 dark:text-dark-300">Apps que generan el rendimiento (opcional link) — elige de la biblioteca o crea una nueva</p>
                          {(settings.appLibrary || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 w-full">Biblioteca:</span>
                              {(settings.appLibrary || []).map((libApp: any) => {
                                const selected = (pl.dailyYield.apps || []).some((a: any) => a.name === libApp.name);
                                return (
                                  <button key={libApp.id} type="button" onClick={() => {
                                    const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])];
                                    if (selected) { const i=apps.findIndex((a:any)=>a.name===libApp.name); if(i>=0) apps.splice(i,1); }
                                    else apps.push({ name: libApp.name, logo: libApp.logo, url: libApp.url });
                                    plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans});
                                  }} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${selected ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 hover:border-emerald-300'}`}>
                                    {libApp.logo ? <img src={libApp.logo} alt={libApp.name} className="w-4 h-4 rounded-full object-cover" /> : null}
                                    {libApp.name} {selected ? '✓' : '+'}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {(pl.dailyYield.apps || []).map((app: any, aIdx: number) => (
                            <div key={aIdx} className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-2">
                              <Input value={app.name} placeholder="Nombre app" className="flex-1" onChange={e => { const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps[aIdx]={...app, name:e.target.value}; plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); }} />
                              <div className="flex items-center gap-2 flex-1">
                                <Input value={app.logo || ''} placeholder="Logo URL (opcional)" className="flex-1" onChange={e => { const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps[aIdx]={...app, logo:e.target.value}; plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); }} />
                                <label className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-xs cursor-pointer hover:bg-gray-50">
                                  Subir
                                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    const fd = new FormData();
                                    fd.append('file', file);
                                    try {
                                      const { data } = await import('@/services/api').then(m => m.api.post('/admin/upload/app-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
                                      const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps[aIdx]={...app, logo: data.url}; plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); toast.success('Logo subido');
                                    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al subir logo'); }
                                    (e.target as HTMLInputElement).value='';
                                  }} />
                                </label>
                                {app.logo && <img src={app.logo} alt={app.name} className="w-6 h-6 rounded object-cover border" />}
                              </div>
                              <Input value={app.url || ''} placeholder="Link URL (opcional)" className="flex-1" onChange={e => { const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps[aIdx]={...app, url:e.target.value}; plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); }} />
                              <button type="button" onClick={() => { const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps.splice(aIdx,1); plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); }} className="text-xs text-red-600 hover:underline shrink-0">Quitar</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => { const plans=[...settings.plans]; const apps=[...(pl.dailyYield.apps||[])]; apps.push({name:'', logo:'', url:''}); plans[idx]={...pl, dailyYield:{...pl.dailyYield, apps}}; setSettings({...settings, plans}); }} className="text-xs text-primary-600 hover:underline">+ Añadir app manual</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              onClick={() => setSettings({
                ...settings,
                plans: [...settings.plans, { id: `plan-${Date.now()}`, name: '', price: 0, tiktok: false, whopUrl: '', dailyYield: { enabled: false, min: 0.1, max: 0.4, bonusPerReferral: 0.02, bonusCap: 0.1 } }],
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
