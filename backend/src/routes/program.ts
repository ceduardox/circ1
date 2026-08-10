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

export async function programRoutes(app: FastifyInstance) {
  app.get('/current-day', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const latestProgress = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: { day: { dayNumber: 'desc' } },
      include: { day: true, content: true },
    });

    let currentDay = await prisma.programDay.findFirst({
      where: { isActive: true },
      orderBy: { dayNumber: 'asc' },
      include: { contents: { orderBy: { orderIndex: 'asc' } } },
    });

    if (latestProgress) {
      const nextDay = await prisma.programDay.findFirst({
        where: { dayNumber: latestProgress.day.dayNumber + 1, isActive: true },
        include: { contents: { orderBy: { orderIndex: 'asc' } } },
      });
      if (nextDay) currentDay = nextDay;
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

    const latestProgress = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: { day: { dayNumber: 'desc' } },
      include: { day: true },
    });

    const maxUnlockedDay = latestProgress?.day?.dayNumber ?? 1;
    if (dayNumber > maxUnlockedDay) {
      return reply.code(403).send({ error: 'Día bloqueado. Completa el día anterior.' });
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

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: { day: true, content: true },
      orderBy: [{ day: { dayNumber: 'asc' } }, { content: { orderIndex: 'asc' } }],
    });

    const reflections = await prisma.userReflection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { progress, reflections };
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
}