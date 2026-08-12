import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { reflectionSchema, completeContentSchema } from '../utils/schemas.js';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
}

interface DayParams { dayNumber: string; }
interface ContentParams { dayNumber: string; contentId: string; }

// Devuelve el día más alto que el usuario puede acceder.
// Regla: el día 1 siempre está desbloqueado. El día N+1 se desbloquea SOLO si se
// completaron TODAS las tareas obligatorias del día N (y así secuencialmente).
async function getMaxUnlockedDay(userId: string): Promise<number> {
  const days = await prisma.programDay.findMany({
    where: { isActive: true },
    orderBy: { dayNumber: 'asc' },
    select: { dayNumber: true, contents: { where: { isRequired: true }, select: { id: true } } },
  });
  if (days.length === 0) return 0;

  const completed = await prisma.userProgress.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { contentId: true },
  });
  const completedSet = new Set(completed.map(p => p.contentId));

  let maxUnlocked = 1;
  for (const day of days) {
    if (day.dayNumber > maxUnlocked) break;
    const requiredIds = day.contents.map(c => c.id);
    // Solo desbloquea el siguiente si el día tiene obligatorias y todas están completas.
    if (requiredIds.length > 0 && requiredIds.every(id => completedSet.has(id))) {
      maxUnlocked = Math.max(maxUnlocked, day.dayNumber + 1);
    }
  }
  return maxUnlocked;
}

export async function programRoutes(app: FastifyInstance) {
  app.get('/current-day', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const maxUnlockedDay = await getMaxUnlockedDay(userId);

    const allDays = await prisma.programDay.findMany({
      where: { isActive: true },
      orderBy: { dayNumber: 'asc' },
      include: { contents: { orderBy: { orderIndex: 'asc' } } },
    });

    // Día actual = primer día desbloqueado que aún no tiene todas sus obligatorias completas.
    const progressByDay = await prisma.userProgress.findMany({
      where: { userId },
      include: { content: true },
    });

    let currentDay: (typeof allDays)[0] | null = null;
    for (const day of allDays) {
      if (day.dayNumber > maxUnlockedDay) break;
      const dayProgress = progressByDay.filter(p => p.dayId === day.id);
      const requiredDone = day.contents.filter(c => c.isRequired).every(c =>
        dayProgress.some(p => p.contentId === c.id && p.status === 'COMPLETED')
      );
      if (!requiredDone) { currentDay = day; break; }
    }
    // Si todos los desbloqueados ya están completos, el actual es el último desbloqueado.
    if (!currentDay) {
      currentDay = allDays.find(d => d.dayNumber <= maxUnlockedDay) || null;
    }

    if (!currentDay) return { day: null, progress: [], canUnlockNext: false, completedRequired: 0, totalRequired: 0 };

    const progress = await prisma.userProgress.findMany({
      where: { userId, dayId: currentDay.id },
      include: { content: true },
    });

    const completedRequired = progress.filter(p => p.content.isRequired && p.status === 'COMPLETED').length;
    const totalRequired = currentDay.contents.filter(c => c.isRequired).length;

    return { day: currentDay, progress, canUnlockNext: completedRequired === totalRequired && totalRequired > 0, completedRequired, totalRequired };
  });

  app.get('/day/:dayNumber', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { dayNumber: dayNumberStr } = request.params as DayParams;
    const dayNumber = parseInt(dayNumberStr);

    const day = await prisma.programDay.findUnique({
      where: { dayNumber },
      include: { contents: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!day) return reply.code(404).send({ error: 'Día no encontrado' });

    const maxUnlockedDay = await getMaxUnlockedDay(userId);
    if (dayNumber > maxUnlockedDay) {
      return reply.code(403).send({ error: 'Día bloqueado. Completa todas las tareas obligatorias del día anterior.' });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId, dayId: day.id },
      include: { content: true },
    });

    return { day, progress };
  });

  app.post('/day/:dayNumber/content/:contentId/complete', { preHandler: authMiddleware }, async (request, reply) => {
    const body = completeContentSchema.parse(request.body);
    const userId = (request.user as JWTPayload).sub;
    const { contentId } = request.params as ContentParams;
    const { answers } = body;

    const content = await prisma.dayContent.findUnique({
      where: { id: contentId },
      include: { day: true },
    });
    if (!content) return reply.code(404).send({ error: 'Contenido no encontrado' });

    const progress = await prisma.userProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      update: { status: 'COMPLETED', answers, completedAt: new Date() },
      create: { userId, dayId: content.dayId, contentId, status: 'COMPLETED', answers, completedAt: new Date() },
    });

    // Si con esta tarea se completan todas las obligatorias del día, notificar que el siguiente día se desbloqueó.
    try {
      const required = await prisma.dayContent.findMany({
        where: { dayId: content.dayId, isRequired: true },
        select: { id: true },
      });
      const completedInDay = await prisma.userProgress.findMany({
        where: { userId, dayId: content.dayId, status: 'COMPLETED' },
        select: { contentId: true },
      });
      const doneSet = new Set(completedInDay.map(p => p.contentId));
      const dayDone = required.length > 0 && required.every(r => doneSet.has(r.id));

      if (dayDone) {
        const nextDay = await prisma.programDay.findFirst({
          where: { dayNumber: content.day.dayNumber + 1, isActive: true },
        });
        if (nextDay) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'achievement',
              title: 'Día desbloqueado',
              message: `Completaste el Día ${content.day.dayNumber}. ¡El Día ${nextDay.dayNumber} ya está disponible!`,
            },
          });
        } else {
          await prisma.notification.create({
            data: {
              userId,
              type: 'achievement',
              title: 'Programa completado',
              message: `Completaste el Día ${content.day.dayNumber}, ¡el último del programa! Felicitaciones.`,
            },
          });
        }
      }
    } catch {
      // No romper el flujo si falla la notificación.
    }

    return { progress };
  });

  app.post('/reflection', { preHandler: authMiddleware }, async (request) => {
    const body = reflectionSchema.parse(request.body);
    const userId = (request.user as JWTPayload).sub;
    const { dayId, reflectionType, content } = body;

    const reflection = await prisma.userReflection.upsert({
      where: { userId_dayId_reflectionType: { userId, dayId, reflectionType } },
      update: { content },
      create: { userId, dayId, reflectionType, content },
    });

    return { reflection };
  });

  app.get('/progress', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const [progress, reflections, completedDays, user] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: { day: true, content: true },
        orderBy: [{ day: { dayNumber: 'asc' } }, { content: { orderIndex: 'asc' } }],
      }),
      prisma.userReflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userProgress.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { streakFreezes: true } }),
    ]);

    let streak = 0;
    let freezableGap = false;
    if (completedDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const uniqueDays = [...new Set(
        completedDays
          .filter(d => d.completedAt)
          .map(d => {
            const date = new Date(d.completedAt!);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          })
      )].sort((a, b) => b - a);

      let checkDate = today.getTime();
      if (uniqueDays[0] !== checkDate) {
        checkDate -= 86400000;
      }

      for (const dayTime of uniqueDays) {
        if (dayTime === checkDate) {
          streak++;
          checkDate -= 86400000;
        } else if (dayTime === checkDate + 86400000) {
          freezableGap = true;
          break;
        } else {
          break;
        }
      }
    }

    const totalCompleted = progress.filter(p => p.status === 'COMPLETED').length;
    const uniqueDaysCompleted = [...new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.dayId))];
    const reflectionCount = reflections.length;
    const quizCount = progress.filter(p => p.content.type === 'QUIZ' && p.status === 'COMPLETED').length;
    const mentalCount = progress.filter(p => p.content.type === 'MENTAL_EXERCISE' && p.status === 'COMPLETED').length;
    const confidenceCount = progress.filter(p => p.content.type === 'CONFIDENCE_TASK' && p.status === 'COMPLETED').length;

    const points = totalCompleted * 10 + uniqueDaysCompleted.length * 5;
    const level = Math.min(100, Math.floor(points / 100) + 1);

    const allContents = await prisma.dayContent.count();
    const overallProgress = allContents > 0 ? Math.round((totalCompleted / allContents) * 100) : 0;

    return {
      progress,
      reflections,
      streak,
      streakFreezes: user?.streakFreezes ?? 0,
      freezableGap,
      points,
      level,
      overallProgress,
      stats: {
        totalCompleted,
        daysCompleted: uniqueDaysCompleted.length,
        reflectionCount,
        quizCount,
        mentalCount,
        confidenceCount,
      },
    };
  });

  app.post('/use-freeze', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { streakFreezes: true } });
    if (!user || user.streakFreezes <= 0) {
      return { error: 'No tienes streak freezes disponibles' };
    }

    // Verificar que hay un gap freezable
    const completedDays = await prisma.userProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    if (completedDays.length === 0) {
      return { error: 'No hay actividad para aplicar freeze' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = [...new Set(
      completedDays
        .filter(d => d.completedAt)
        .map(d => {
          const date = new Date(d.completedAt!);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
    )].sort((a, b) => b - a);

    let checkDate = today.getTime();
    if (uniqueDays[0] !== checkDate) {
      checkDate -= 86400000;
    }

    // Verificar que el primer día coincide (racha activa)
    if (uniqueDays[0] === checkDate) {
      return { error: 'Tu racha está activa, no necesitas un freeze hoy' };
    }

    // Verificar que hay exactamente 1 día de gap
    if (uniqueDays[0] !== checkDate + 86400000) {
      return { error: 'El gap es demasiado grande para un freeze' };
    }

    // Usar el freeze
    await prisma.user.update({
      where: { id: userId },
      data: { streakFreezes: { decrement: 1 } },
    });

    return {
      success: true,
      streakFreezes: user.streakFreezes - 1,
      message: 'Streak freeze aplicado. Tu racha está protegida.',
    };
  });

  app.get('/days', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const days = await prisma.programDay.findMany({
      where: { isActive: true },
      orderBy: { dayNumber: 'asc' },
      include: {
        contents: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, type: true, isRequired: true },
        },
      },
    });

    const allProgress = await prisma.userProgress.findMany({
      where: { userId },
      select: { dayId: true, contentId: true, status: true },
    });

    const maxUnlockedDay = await getMaxUnlockedDay(userId);

    const daysWithProgress = days.map(day => {
      const dayProgress = allProgress.filter(p => p.dayId === day.id);
      const completedCount = dayProgress.filter(p => p.status === 'COMPLETED').length;
      const requiredContents = day.contents.filter(c => c.isRequired);
      const completedRequired = dayProgress.filter(p => p.status === 'COMPLETED' && requiredContents.some(c => c.id === p.contentId)).length;
      const isUnlocked = day.dayNumber <= maxUnlockedDay;

      return {
        ...day,
        totalContents: day.contents.length,
        completedCount,
        totalRequired: requiredContents.length,
        completedRequired,
        isUnlocked,
        isCompleted: completedCount === day.contents.length && day.contents.length > 0,
      };
    });

    return { days: daysWithProgress };
  });

  app.post('/previous-day', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const latestProgress = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: { day: { dayNumber: 'desc' } },
      include: { day: true },
    });

    if (!latestProgress || latestProgress.day.dayNumber <= 1) {
      return { dayNumber: 1 };
    }

    return { dayNumber: latestProgress.day.dayNumber - 1 };
  });

  app.get('/achievements', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const [allProgress, allDays, reflections] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId, status: 'COMPLETED' },
        include: { day: true, content: true },
        orderBy: { completedAt: 'asc' },
      }),
      prisma.programDay.findMany({
        where: { isActive: true },
        orderBy: { dayNumber: 'asc' },
        include: { contents: { orderBy: { orderIndex: 'asc' } } },
      }),
      prisma.userReflection.findMany({ where: { userId } }),
    ]);

    const achievements: { id: string; title: string; description: string; icon: string; unlockedAt: string | null; progress: number; target: number }[] = [];

    const totalCompleted = allProgress.length;
    const completedDays = allProgress.filter(p => p.status === 'COMPLETED');
    const uniqueDaysCompleted = [...new Set(completedDays.map(p => p.dayId))];
    const reflectionCount = reflections.length;
    const quizResults = allProgress.filter(p => p.content.type === 'QUIZ');
    const mentalExercises = allProgress.filter(p => p.content.type === 'MENTAL_EXERCISE');
    const confidenceTasks = allProgress.filter(p => p.content.type === 'CONFIDENCE_TASK');
    const affirmations = allProgress.filter(p => p.content.type === 'AFFIRMATION');

    // Primer Paso
    const firstStep = allProgress[0];
    achievements.push({
      id: 'first_step',
      title: 'Primer Paso',
      description: 'Completa tu primer ejercicio',
      icon: 'Footprints',
      unlockedAt: firstStep?.completedAt?.toISOString() || null,
      progress: Math.min(totalCompleted, 1),
      target: 1,
    });

    // Día Completado
    const allDaysCompleted = uniqueDaysCompleted.filter(dayId => {
      const day = allDays.find(d => d.id === dayId);
      if (!day) return false;
      const dayContents = day.contents.length;
      const completedInDay = completedDays.filter(p => p.dayId === dayId).length;
      return completedInDay === dayContents && dayContents > 0;
    });
    const firstDayCompleted = allDaysCompleted.length > 0
      ? completedDays.find(p => allDaysCompleted.includes(p.dayId))?.completedAt
      : null;
    achievements.push({
      id: 'day_master',
      title: 'Día Completado',
      description: 'Completa todos los ejercicios de un día',
      icon: 'CalendarCheck',
      unlockedAt: firstDayCompleted?.toISOString() || null,
      progress: Math.min(allDaysCompleted.length, 1),
      target: 1,
    });

    // Racha de 3
    const completedDayNumbers = [...new Set(completedDays.map(p => p.day.dayNumber))].sort((a, b) => a - b);
    let maxStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < completedDayNumbers.length; i++) {
      if (i === 0 || completedDayNumbers[i] === completedDayNumbers[i - 1] + 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    achievements.push({
      id: 'streak_3',
      title: 'Racha de 3',
      description: 'Completa 3 días seguidos',
      icon: 'Flame',
      unlockedAt: maxStreak >= 3 ? completedDays[completedDays.length - 1]?.completedAt?.toISOString() || null : null,
      progress: Math.min(maxStreak, 3),
      target: 3,
    });

    // Semana Completa
    achievements.push({
      id: 'week_complete',
      title: 'Semana Completa',
      description: 'Completa los 7 días del programa',
      icon: 'Crown',
      unlockedAt: uniqueDaysCompleted.length >= 7 ? completedDays[completedDays.length - 1]?.completedAt?.toISOString() || null : null,
      progress: Math.min(uniqueDaysCompleted.length, 7),
      target: 7,
    });

    // Reflexión Profunda
    achievements.push({
      id: 'deep_reflection',
      title: 'Reflexión Profunda',
      description: 'Escribe al menos 3 reflexiones',
      icon: 'PenLine',
      unlockedAt: reflectionCount >= 3 ? reflections[reflections.length - 1]?.createdAt?.toISOString() || null : null,
      progress: Math.min(reflectionCount, 3),
      target: 3,
    });

    // Mente Activa
    achievements.push({
      id: 'mind_active',
      title: 'Mente Activa',
      description: 'Completa 3 ejercicios mentales',
      icon: 'Brain',
      unlockedAt: mentalExercises.length >= 3 ? mentalExercises[mentalExercises.length - 1]?.completedAt?.toISOString() || null : null,
      progress: Math.min(mentalExercises.length, 3),
      target: 3,
    });

    // Valiente
    achievements.push({
      id: 'brave',
      title: 'Valiente',
      description: 'Completa una tarea de confianza',
      icon: 'Shield',
      unlockedAt: confidenceTasks.length >= 1 ? confidenceTasks[0]?.completedAt?.toISOString() || null : null,
      progress: Math.min(confidenceTasks.length, 1),
      target: 1,
    });

    // afirmaciones
    achievements.push({
      id: 'affirmations_5',
      title: 'Afirmaciones Diarias',
      description: 'Completa 5 afirmaciones',
      icon: 'Heart',
      unlockedAt: affirmations.length >= 5 ? affirmations[affirmations.length - 1]?.completedAt?.toISOString() || null : null,
      progress: Math.min(affirmations.length, 5),
      target: 5,
    });

    const unlocked = achievements.filter(a => a.unlockedAt);
    const locked = achievements.filter(a => !a.unlockedAt);

    return { achievements, unlockedCount: unlocked.length, totalCount: achievements.length };
  });

  // Búsqueda global
  app.get('/search', { preHandler: authMiddleware }, async (request) => {
    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 2) {
      return { days: [], contents: [] };
    }

    const query = q.trim();

    const [days, contents] = await Promise.all([
      prisma.programDay.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { dayNumber: 'asc' },
        take: 10,
      }),
      prisma.dayContent.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { day: { select: { dayNumber: true, title: true } } },
        orderBy: { orderIndex: 'asc' },
        take: 15,
      }),
    ]);

    return { days, contents };
  });
}