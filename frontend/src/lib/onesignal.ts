// Wrapper tipado para el SDK web de OneSignal (v16).
// Se carga en index.html con OneSignalDeferred y se usa para:
//  - Pedir permiso de notificaciones (botón del chat / panel)
//  - Asociar el usuario autenticado (external_user_id) → el backend envía push con ese id.

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

type OneSignalSDK = any;

let sdkPromise: Promise<OneSignalSDK> | null = null;

// Obtiene el SDK de OneSignal ya inicializado por index.html.
// El init real ocurre en index.html; aquí solo esperamos a que esté listo.
function getSDK(): Promise<OneSignalSDK> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!window.OneSignalDeferred) {
      sdkPromise = null;
      return reject(new Error('SDK de OneSignal no cargado'));
    }
    const push: ((sdk: OneSignalSDK) => void)[] = window.OneSignalDeferred;
    push.push((OneSignal: OneSignalSDK) => {
      resolve(OneSignal);
    });
  });

  return sdkPromise;
}

/**
 * Pide permiso al usuario para enviar notificaciones push.
 * Usa el flujo de OneSignal que muestra el modal nativo y registra la suscripción.
 * Devuelve true si quedó suscrito.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const OneSignal = await getSDK();
    if (!OneSignal?.Notifications) return false;

    // Si ya está suscrito, listo.
    const subscribed = await OneSignal.Notifications.isSubscribed().catch(() => false);
    if (subscribed) return true;

    // Pide permiso (muestra el modal nativo del navegador y registra la suscripción).
    const result = await OneSignal.Notifications.requestPermission();
    if (result === 'granted') {
      // Espera a que OneSignal registre la suscripción del navegador.
      for (let i = 0; i < 10; i++) {
        const now = await OneSignal.Notifications.isSubscribed().catch(() => false);
        if (now) return true;
        await new Promise(r => setTimeout(r, 500));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('[OneSignal] requestPushPermission:', e);
    return false;
  }
}

/**
 * Consulta si el navegador ya tiene el permiso de notificaciones concedido.
 */
export async function hasPushPermission(): Promise<boolean> {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return true;
  try {
    const OneSignal = await getSDK();
    if (!OneSignal?.Notifications) return false;
    return await OneSignal.Notifications.isSubscribed().catch(() => false);
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
