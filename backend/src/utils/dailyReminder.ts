import { prisma } from './prisma.js';
import { sendWebPush } from './onesignal.js';

// Recordatorio diario simple: cada minuto revisa si ya es la hora (08:00 por defecto)
// y si aún no se envió hoy. Envía una vez por día a los usuarios con push activado.
export function scheduleDailyReminder() {
  const hour = Number(process.env.DAILY_REMINDER_HOUR || '8');
  let lastSentDate = '';

  setInterval(async () => {
    const now = new Date();
    if (now.getHours() !== hour) return;

    const today = now.toISOString().slice(0, 10);
    if (lastSentDate === today) return;
    lastSentDate = today;

    try {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const users = await prisma.user.findMany({
        where: { pushEnabled: true, role: { not: 'ADMIN' } },
        select: { id: true },
      });
      if (users.length === 0) return;

      const activeToday = await prisma.userProgress.findMany({
        where: { completedAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ['userId'],
      });
      const activeSet = new Set(activeToday.map(p => p.userId));
      const targets = users.filter(u => !activeSet.has(u.id));
      if (targets.length === 0) return;

      await sendWebPush({
        externalUserIds: targets.map(u => u.id),
        title: '🌅 ¡Buenos días! Tu tarea de hoy te espera',
        message: 'Hoy también es un día para avanzar. Completa tu tarea de Círculo 1.',
        url: '/dashboard',
      });
      console.log(`🌅 Recordatorio diario enviado a ${targets.length} usuarios`);
    } catch (e) {
      console.error('❌ Error en recordatorio diario:', e);
    }
  }, 60 * 1000);

  console.log(`⏰ Recordatorio diario programado a las ${hour}:00`);
}
