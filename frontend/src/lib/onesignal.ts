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
 * Devuelve true si quedó suscrito.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const OneSignal = await getSDK(true);
    if (!OneSignal.Notifications) return false;
    const permission = await OneSignal.Notifications.permissionNative();
    if (permission === 'granted') return true;
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