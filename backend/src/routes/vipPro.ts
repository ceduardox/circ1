import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export async function vipProRoutes(app: FastifyInstance) {
  app.get('/modules', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;

    const [modules, progress] = await Promise.all([
      prisma.vipProModule.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      }),
      prisma.vipProProgress.findMany({
        where: { userId: user.id },
        select: { moduleId: true, completed: true, completedAt: true, checks: true },
      }),
    ]);

    const progressMap = new Map(progress.map(p => [p.moduleId, p]));

    const data = modules.map(m => {
      const prog = progressMap.get(m.id);
      const checkItems = (m.checkItems as any[]) ?? [];
      const checks = (prog?.checks as any[]) ?? [];
      const completed = checkItems.length > 0
        ? checkItems.every(item => checks.includes(item))
        : (prog?.completed ?? false);

      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        subtitle: m.subtitle,
        icon: m.icon,
        image: m.image,
        description: m.description,
        steps: m.steps,
        links: m.links,
        checkItems,
        checks,
        statNumber: m.statNumber,
        statLabel: m.statLabel,
        orderIndex: m.orderIndex,
        completed,
        completedAt: completed ? prog?.completedAt ?? null : null,
      };
    });

    return reply.send({ modules: data });
  });

  app.post('/modules/:id/toggle', { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { item?: string };

    const module = await prisma.vipProModule.findUnique({ where: { id } });
    if (!module) {
      return reply.code(404).send({ error: 'Módulo no encontrado' });
    }

    const existing = await prisma.vipProProgress.findUnique({
      where: { userId_moduleId: { userId: user.id, moduleId: id } },
    });

    const checkItems = (module.checkItems as any[]) ?? [];
    const checks = (existing?.checks as any[]) ?? [];

    // Si el módulo tiene items de check y se pasa uno, alterna ese item
    if (checkItems.length > 0 && body.item) {
      if (!checkItems.includes(body.item)) {
        return reply.code(400).send({ error: 'Item de registro no válido para este módulo' });
      }
      const has = checks.includes(body.item);
      const nextChecks = has ? checks.filter(c => c !== body.item) : [...checks, body.item];
      const completed = checkItems.every(item => nextChecks.includes(item));

      const progress = await prisma.vipProProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: id } },
        update: { checks: nextChecks, completed, completedAt: completed ? (existing?.completedAt ?? new Date()) : null },
        create: { userId: user.id, moduleId: id, checks: nextChecks, completed, completedAt: completed ? new Date() : null },
      });

      return reply.send({ completed: progress.completed, completedAt: progress.completedAt, checks: nextChecks });
    }

    // Toggle global (para módulos sin items)
    const next = !(existing?.completed ?? false);
    const progress = await prisma.vipProProgress.upsert({
      where: { userId_moduleId: { userId: user.id, moduleId: id } },
      update: { completed: next, completedAt: next ? new Date() : null },
      create: { userId: user.id, moduleId: id, completed: next, completedAt: next ? new Date() : null },
    });

    return reply.send({ completed: progress.completed, completedAt: progress.completedAt, checks: checks });
  });
}
