import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getNativePushPermission, hasPushPermission, requestPushPermission, syncPushUser } from '@/lib/onesignal';
import { Bell, BellRing, MessageCircle, Coins, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent } from '@/components/ui';

function Toggle({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  );
}

function PrefToggle({
  icon: Icon,
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  icon: any;
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors ${
        checked
          ? 'border-primary-200 bg-primary-50 dark:border-primary-700/50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800'
      } ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-primary-300'}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${checked ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500 dark:bg-dark-700'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <Toggle checked={checked} />
      </div>
      <div>
        <p className="font-medium text-sm text-gray-900 dark:text-dark-100">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

export function PushNotificationsPanel() {
  const { user, updatePushPreferences } = useAuthStore();
  const [devicePushEnabled, setDevicePushEnabled] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [pushPromptHint, setPushPromptHint] = useState('');

  useEffect(() => {
    let cancelled = false;
    hasPushPermission().then(enabled => {
      if (!cancelled) setDevicePushEnabled(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  const updatePushEnabled = async () => {
    setPrefsLoading(true);
    setPushPromptHint('');
    try {
      if (devicePushEnabled) {
        await updatePushPreferences({ pushEnabled: false });
        setDevicePushEnabled(false);
        toast.success('Notificaciones desactivadas');
        return;
      }
      const granted = await requestPushPermission();
      if (!granted) {
        const permission = getNativePushPermission();
        setPushPromptHint(permission === 'denied'
          ? 'Las notificaciones están bloqueadas para este sitio. Abre el candado de la barra de dirección, entra a Permisos y cambia Notificaciones a Permitir.'
          : permission === 'unsupported'
          ? 'Este navegador o modo de navegación no admite notificaciones. En iPhone/iPad agrega la página a Pantalla de inicio y ábrela desde allí.'
          : 'No se pudo terminar la suscripción. Recarga la página e inténtalo nuevamente.');
        return;
      }
      // Asocia el usuario a la suscripción de OneSignal (sin esto no llega el push).
      await syncPushUser(user?.id as string);
      await updatePushPreferences({ pushEnabled: true });
      setDevicePushEnabled(true);
      toast.success('Notificaciones activadas');
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
      toast.success('Preferencia actualizada');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar la preferencia');
    } finally {
      setPrefsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-100 pb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-600" />
          Notificaciones Push
        </h3>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-sm text-gray-500">
          Activa qué notificaciones quieres recibir en tu navegador (PC, Android o en
          pantalla de inicio en iPhone/iPad). Sin activarlas no se te enviará nada.
        </p>

        {/* Master switch */}
        <button
          type="button"
          onClick={() => updatePushEnabled()}
          disabled={prefsLoading}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${devicePushEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
              {devicePushEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-dark-100">
                {devicePushEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
              </p>
              <p className="text-xs text-gray-500">
                {devicePushEnabled ? 'Recibirás avisos cuando haya actividad' : 'Toca para pedir permiso y recibir avisos'}
              </p>
            </div>
          </div>
          <Toggle checked={devicePushEnabled} disabled={prefsLoading} />
        </button>

        {/* Sub-toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <PrefToggle
            icon={MessageCircle}
            title="Menciones del chat"
            desc="Avisos cuando te mencionan con @"
            checked={!!(devicePushEnabled && user?.pushChat)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushChat', v)}
          />
          <PrefToggle
            icon={BellRing}
            title="Todo el chat"
            desc="Aviso de cada mensaje en el chat"
            checked={!!(devicePushEnabled && user?.pushChatAll)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushChatAll', v)}
          />
          <PrefToggle
            icon={Coins}
            title="Comisiones"
            desc="Comisiones de tus referidos"
            checked={!!(devicePushEnabled && user?.pushCommissions)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushCommissions', v)}
          />
          <PrefToggle
            icon={CreditCard}
            title="Pagos y retiros"
            desc="Membresía activa y retiros"
            checked={!!(devicePushEnabled && user?.pushPayments)}
            disabled={!devicePushEnabled || prefsLoading}
            onChange={(v) => updatePref('pushPayments', v)}
          />
        </div>

        {pushPromptHint && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            {pushPromptHint}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
