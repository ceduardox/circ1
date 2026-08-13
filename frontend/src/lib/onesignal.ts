// Wrapper tipado para el SDK web de OneSignal (v16).
// Se carga en index.html con OneSignalDeferred y se usa para:
//  - Pedir permiso de notificaciones (botón del chat / panel)
//  - Asociar el usuario autenticado (external_user_id) → el backend envía push con ese id.

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    oneSignalClient?: any;
    oneSignalReady?: boolean;
    oneSignalInitError?: string | null;
    oneSignalInitPromise?: Promise<boolean>;
  }
}

type OneSignalSDK = any;

// Obtiene el SDK de OneSignal ya inicializado por index.html.
// Usa la misma promesa y el mismo cliente para permisos, identidad y estado.
async function getSDK(): Promise<OneSignalSDK> {
  if (window.oneSignalReady && window.oneSignalClient) return window.oneSignalClient;
  if (!window.oneSignalInitPromise) throw new Error('SDK de OneSignal no cargado');

  const ready = await Promise.race([
    window.oneSignalInitPromise,
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), 8000)),
  ]);
  if (!ready || !window.oneSignalClient) {
    throw new Error(window.oneSignalInitError || 'OneSignal no terminó de inicializar');
  }
  return window.oneSignalClient;
}

/**
 * Pide permiso al usuario para enviar notificaciones push.
 * Usa el flujo de OneSignal que muestra el modal nativo y registra la suscripción.
 * Devuelve true si quedó suscrito.
 */
export async function requestPushPermission(): Promise<boolean> {
  // Debe ejecutarse antes de cualquier await: los navegadores solo permiten
  // abrir el diálogo nativo mientras conservan el gesto directo del usuario.
  if (typeof Notification === 'undefined') return false;

  if (Notification.permission === 'default') {
    try {
      const nativePermission = await Notification.requestPermission();
      if (nativePermission !== 'granted') return false;
    } catch (e) {
      console.error('[Push] Notification.requestPermission:', e);
      return false;
    }
  }

  // Si el usuario lo bloqueó anteriormente, el navegador ya no puede volver a
  // mostrar el modal: debe habilitarlo desde el candado/configuración del sitio.
  if (Notification.permission !== 'granted') return false;

  try {
    const OneSignal = await getSDK();
    if (!OneSignal?.User?.PushSubscription) return false;

    // OneSignal v16 expone la suscripción en User.PushSubscription.
    if (Notification.permission === 'granted' && OneSignal.User?.PushSubscription?.optedIn) {
      return true;
    }

    // Con el permiso concedido, registra/reactiva la suscripción en OneSignal.
    await OneSignal.User.PushSubscription.optIn();
    for (let i = 0; i < 12; i++) {
      if (OneSignal.User?.PushSubscription?.optedIn && OneSignal.User?.PushSubscription?.id) {
        return true;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    return !!OneSignal.User?.PushSubscription?.optedIn;
  } catch (e) {
    console.error('[OneSignal] requestPushPermission:', e);
    return false;
  }
}

export function getNativePushPermission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/**
 * Consulta si el navegador ya tiene el permiso de notificaciones concedido.
 */
export async function hasPushPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const OneSignal = await getSDK();
    return !!OneSignal.User?.PushSubscription?.optedIn;
  } catch {
    return false;
  }
}

/**
 * Asocia el id interno del usuario (external_user_id) para poder enviarle
 * push dirigidos por ese id. Pasar null desasocia (logout).
 * IMPORTANTE: debe llamarse DESPUÉS de que la suscripción esté activa.
 */
export async function syncPushUser(userId: string | null): Promise<void> {
  try {
    const OneSignal = await getSDK();
    if (!OneSignal?.login) return;

    // Espera un poco a que el SDK esté listo si la suscripción aún se está registrando.
    const tryLogin = async () => {
      if (userId) {
        await OneSignal.login(userId);
      } else {
        await OneSignal.logout();
      }
    };

    try {
      await tryLogin();
    } catch {
      // Reintenta tras 1s (el SDK puede no estar listo aún).
      await new Promise(r => setTimeout(r, 1000));
      await tryLogin();
    }
  } catch (e) {
    console.error('[OneSignal] syncPushUser:', e);
  }
}
