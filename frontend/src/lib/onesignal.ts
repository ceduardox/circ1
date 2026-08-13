// Wrapper tipado para el SDK web de OneSignal (v16).
// Se carga en index.html con OneSignalDeferred y se usa para:
//  - Pedir permiso de notificaciones (botón del chat)
//  - Asociar el usuario autenticado (external_user_id) → el backend envía push con ese id.

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

type OneSignalSDK = any;

let sdkPromise: Promise<OneSignalSDK> | null = null;

// Obtiene el SDK de OneSignal (ya inicializado por index.html).
// Se cachea para no re-inicializar ni depender del deferred array repetidamente.
function getSDK(init: boolean): Promise<OneSignalSDK> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!window.OneSignalDeferred) {
      sdkPromise = null;
      return reject(new Error('SDK de OneSignal no cargado'));
    }
    const push: ((sdk: OneSignalSDK) => void)[] = window.OneSignalDeferred;
    push.push(async (OneSignal: OneSignalSDK) => {
      try {
        if (init) {
          // idempotente; si ya estaba iniciado, no rompe nada.
          await OneSignal.init({
            appId: '3cb5f8f5-b0a1-4c16-91a7-8f83567808a9',
          });
        }
        resolve(OneSignal);
      } catch (err) {
        // Aunque el init falle (ya inicializado con otros params), igual
        // resolvemos con el SDK para poder usar sus métodos.
        resolve(OneSignal);
      }
    });
  });

  return sdkPromise;
}

/**
 * Pide permiso al usuario para enviar notificaciones push.
 * Usa la API nativa del navegador (Notification) que muestra el modal
 * "Permitir / Bloquear" en todos los sistemas (Windows, Android, iOS PWA).
 * Devuelve true si quedó concedido.
 */
export async function requestPushPermission(): Promise<boolean> {
  // 1. Si ya está concedido, listo.
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return true;
  }

  // 2. API nativa: dispara el modal del navegador.
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        // Sincroniza OneSignal con la suscripción ya concedida.
        try {
          const OneSignal = await getSDK(false);
          if (OneSignal?.Notifications?.setSubscription) {
            await OneSignal.Notifications.setSubscription(true);
          }
        } catch { /* OneSignal se sincroniza solo al detectar el permiso */ }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 3. Fallback: pedir vía OneSignal (para casos donde el SDK lo maneja mejor).
  try {
    const OneSignal = await getSDK(true);
    if (!OneSignal.Notifications) return false;
    const result = await OneSignal.Notifications.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Consulta si el navegador ya tiene el permiso de notificaciones concedido.
 */
export async function hasPushPermission(): Promise<boolean> {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return true;
  }
  try {
    const OneSignal = await getSDK(false);
    if (!OneSignal.Notifications) return false;
    const permission = await OneSignal.Notifications.permissionNative();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Asocia el id interno del usuario (external_user_id) para poder enviarle
 * push dirigidos por ese id. Pasar null desasocia (logout).
 */
export async function syncPushUser(userId: string | null): Promise<void> {
  try {
    const OneSignal = await getSDK(false);
    if (!OneSignal) return;
    if (userId) {
      await OneSignal.login(userId);
    } else {
      await OneSignal.logout();
    }
  } catch {
    // No romper la app si el SDK no está listo / localhost sin permiso.
  }
}