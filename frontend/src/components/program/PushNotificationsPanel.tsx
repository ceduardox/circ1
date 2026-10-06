import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getNativePushPermission, hasPushPermission, requestPushPermission, syncPushUser } from '@/lib/onesignal';
import { Bell, BellRing, MessageCircle, Coins, CreditCard, ShieldCheck, Sparkles, Send, CheckCircle2, AlertTriangle, Smartphone, Laptop, Check } from 'lucide-react';
import { toast } from 'sonner';
import { membershipApi } from '@/services/api';

function Toggle({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
        checked ? 'bg-sky-500 shadow-sm shadow-sky-500/30' : 'bg-gray-300 dark:bg-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  desc,
  gradient,
  checked,
  disabled,
  onChange,
}: {
  icon: any;
  title: string;
  desc: string;
  gradient: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`group relative p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-4 ${
        checked
          ? 'bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 dark:from-sky-950/20 dark:via-dark-800 dark:to-dark-800 border-sky-200 dark:border-sky-800/60 shadow-sm'
          : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 opacity-80 hover:opacity-100 hover:border-gray-300 dark:hover:border-dark-600'
      } ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md shadow-sky-500/10 shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <Toggle checked={checked} disabled={disabled} />
      </div>

      <div>
        <p className="font-bold text-sm text-gray-900 dark:text-dark-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 leading-relaxed">{desc}</p>
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-dark-700/60 flex items-center justify-between text-[11px]">
        <span className={checked ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-gray-400 font-medium'}>
          {checked ? 'Canal Activo' : 'Desactivado'}
        </span>
        {checked && <Check className="w-3.5 h-3.5 text-sky-500" />}
      </div>
    </div>
  );
}

export function PushNotificationsPanel({ onTestSuccess }: { onTestSuccess?: () => void }) {
  const { user, updatePushPreferences } = useAuthStore();
  const [devicePushEnabled, setDevicePushEnabled] = useState(false);
  const [nativePerm, setNativePerm] = useState<string>('default');
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushPromptHint, setPushPromptHint] = useState('');

  const checkStatus = async () => {
    const enabled = await hasPushPermission();
    setDevicePushEnabled(enabled);
    const perm = getNativePushPermission();
    setNativePerm(perm);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const updatePushEnabled = async () => {
    setPrefsLoading(true);
    setPushPromptHint('');
    try {
      if (devicePushEnabled) {
        await updatePushPreferences({ pushEnabled: false });
        setDevicePushEnabled(false);
        setNativePerm('default');
        toast.success('Notificaciones push desactivadas');
        return;
      }
      const granted = await requestPushPermission();
      if (!granted) {
        const permission = getNativePushPermission();
        setNativePerm(permission);
        setPushPromptHint(permission === 'denied'
          ? 'Las notificaciones están bloqueadas para este sitio en tu navegador. Haz clic en el candado o icono de ajustes en la barra de URL y cambia "Notificaciones" a "Permitir".'
          : permission === 'unsupported'
          ? 'Este navegador no soporta Notificaciones Web Push nativas. En iPhone/iPad, agrega Círculo 1 a la Pantalla de Inicio (PWA) desde Safari.'
          : 'No se pudo completar la suscripción. Recarga la página e intenta nuevamente.');
        return;
      }
      // Asocia el usuario a OneSignal
      if (user?.id) {
        await syncPushUser(user.id);
      }
      await updatePushPreferences({ pushEnabled: true });
      setDevicePushEnabled(true);
      setNativePerm('granted');
      toast.success('¡Notificaciones Push activadas con éxito!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar las notificaciones');
    } finally {
      setPrefsLoading(false);
    }
  };

  const updatePref = async (key: 'pushChat' | 'pushChatAll' | 'pushCommissions' | 'pushPayments', value: boolean) => {
    setPrefsLoading(true);
    try {
      await updatePushPreferences({ [key]: value });
      toast.success('Preferencia de alertas actualizada');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar la preferencia');
    } finally {
      setPrefsLoading(false);
    }
  };

  const sendTestPush = async () => {
    setTesting(true);
    try {
      await membershipApi.testNotification();
      toast.success('¡Notificación de prueba enviada! Revisa tu navegador y campana.');
      if (onTestSuccess) onTestSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo enviar la notificación de prueba');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Push Control Card */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${devicePushEnabled ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-gray-100 dark:bg-dark-700 text-gray-500'}`}>
                {devicePushEnabled ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100">
                Notificaciones Push en este Navegador
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-400 max-w-xl leading-relaxed">
              Recibe avisos inmediatos en tu computadora o móvil (Android / iOS PWA) incluso cuando la pestaña de la aplicación esté en segundo plano.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {devicePushEnabled && (
              <button
                type="button"
                onClick={sendTestPush}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-100 transition-all shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Enviando...' : 'Probar Notificación'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={updatePushEnabled}
              disabled={prefsLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                devicePushEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-gray-900 dark:bg-dark-700 hover:bg-black text-white'
              }`}
            >
              <Toggle checked={devicePushEnabled} disabled={prefsLoading} />
              <span>{devicePushEnabled ? 'Push Habilitado' : 'Activar Push'}</span>
            </button>
          </div>
        </div>

        {/* Estado Diagnóstico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-dark-700 text-xs">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-dark-900/40 border border-gray-100 dark:border-dark-700">
            <span className={`w-2.5 h-2.5 rounded-full ${nativePerm === 'granted' ? 'bg-emerald-500 animate-ping' : nativePerm === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div>
              <p className="font-semibold text-gray-800 dark:text-dark-200">Permiso del Navegador</p>
              <p className="text-[11px] text-gray-400 capitalize">{nativePerm === 'granted' ? 'Permitido (Granted)' : nativePerm === 'denied' ? 'Bloqueado (Denied)' : 'No solicitado'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-dark-900/40 border border-gray-100 dark:border-dark-700">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <div>
              <p className="font-semibold text-gray-800 dark:text-dark-200">Sincronización OneSignal</p>
              <p className="text-[11px] text-gray-400">{user?.id ? 'Usuario Conectado' : 'Pendiente'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-dark-900/40 border border-gray-100 dark:border-dark-700">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <div>
              <p className="font-semibold text-gray-800 dark:text-dark-200">Soporte Multi-dispositivo</p>
              <p className="text-[11px] text-gray-400">PC, Mac, Android e iOS</p>
            </div>
          </div>
        </div>

        {pushPromptHint && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Aviso de Configuración:</p>
              <p className="leading-relaxed">{pushPromptHint}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Canales de Alerta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-900 dark:text-dark-100">Canales y Alertas Individuales</h4>
          <span className="text-xs text-gray-400">Personaliza qué eventos te notifican</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <ChannelCard
            icon={MessageCircle}
            gradient="from-indigo-500 to-purple-600"
            title="Menciones del Chat"
            desc="Avisos cuando alguien te etiqueta con @ en el chat"
            checked={!!(devicePushEnabled && user?.pushChat)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushChat', v)}
          />
          <ChannelCard
            icon={BellRing}
            gradient="from-sky-500 to-blue-600"
            title="Todo el Chat"
            desc="Aviso de cada mensaje nuevo en la sala general"
            checked={!!(devicePushEnabled && user?.pushChatAll)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushChatAll', v)}
          />
          <ChannelCard
            icon={Coins}
            gradient="from-emerald-500 to-teal-600"
            title="Comisiones & Red"
            desc="Alertas instantáneas de ventas de tu equipo de afiliados"
            checked={!!(devicePushEnabled && user?.pushCommissions)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushCommissions', v)}
          />
          <ChannelCard
            icon={CreditCard}
            gradient="from-amber-500 to-orange-600"
            title="Pagos & Retiros"
            desc="Confirmación de retiros aprobados y estado de membresía"
            checked={!!(devicePushEnabled && user?.pushPayments)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushPayments', v)}
          />
        </div>
      </div>
    </div>
  );
}

