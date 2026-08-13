import { config } from '../config/index.js';

interface SendPushParams {
  externalUserIds: string[];
  title: string;
  message: string;
  url?: string;
  icon?: string;
}

/**
 * Envía notificaciones web push mediante la API REST de OneSignal.
 * Los destinatarios se identifican por external_user_id (el id interno del usuario,
 * asociado en el frontend con OneSignal.login(userId)).
 */
export async function sendWebPush(params: SendPushParams): Promise<boolean> {
  const { appId, apiKey, webUrl } = config.onesignal;
  if (!appId || !apiKey) {
    console.warn('[OneSignal] Falta ONESIGNAL_APP_ID o ONESIGNAL_API_KEY en .env');
    return false;
  }
  if (!params.externalUserIds.length) return false;

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: params.externalUserIds },
        target_channel: 'push',
        headings: { en: params.title, es: params.title },
        contents: { en: params.message, es: params.message },
        url: params.url || webUrl,
        icon: params.icon || undefined,
        chrome_web_icon: params.icon || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[OneSignal] Error ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[OneSignal] Error de red:', e);
    return false;
  }
}
