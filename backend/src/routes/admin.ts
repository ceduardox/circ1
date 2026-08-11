import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { ContentType } from '@prisma/client';
import { activateMembership } from '../utils/activation.js';

const createDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  unlockDate: z.string().datetime().optional(),
});

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30, 'El usuario no puede tener más de 30 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  age: z.number().int().min(13, 'La edad mínima es 13 años').max(120, 'La edad máxima es 120 años').optional(),
  country: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const updateDaySchema = createDaySchema.partial();

const createContentSchema = z.object({
  dayId: z.string().uuid(),
  type: z.enum(['REFLECTION', 'AFFIRMATION', 'VIDEO', 'QUIZ', 'MENTAL_EXERCISE', 'CONFIDENCE_TASK']),
  title: z.string().min(1).max(255),
  content: z.any(),
  orderIndex: z.number().int().default(0),
  isRequired: z.boolean().default(true),
});

const updateContentSchema = createContentSchema.partial().omit({ dayId: true });

const reorderContentsSchema = z.object({
  dayId: z.string().uuid(),
  contentIds: z.array(z.string().uuid()),
});

interface IdParams { id: string; }
interface DayIdParams { dayId: string; }
interface UserQuery { page?: string; limit?: string; search?: string; }
interface JWTPayload { sub: string; email: string; role: string; type?: string; }

export async function adminRoutes(app: FastifyInstance) {
  app.get('/stats', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [
      totalUsers,
      totalDays,
      totalContents,
      completedToday,
      totalCompletions,
      activeUsersWeek,
      reflectionsCount,
      quizzesPassed,
      dayCompletions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.programDay.count(),
      prisma.dayContent.count(),
      prisma.userProgress.count({ where: { status: 'COMPLETED', completedAt: { gte: todayStart } } }),
      prisma.userProgress.count({ where: { status: 'COMPLETED' } }),
      prisma.userProgress.findMany({
        where: { status: 'COMPLETED', completedAt: { gte: weekAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.userReflection.count(),
      prisma.userProgress.count({ where: { content: { type: 'QUIZ' }, status: 'COMPLETED' } }),
      prisma.userProgress.findMany({
        where: { status: 'COMPLETED' },
        select: { dayId: true },
        distinct: ['dayId'],
      }),
    ]);

    const avgProgress = totalUsers > 0 && totalContents > 0
      ? Math.round((totalCompletions / (totalUsers * totalContents)) * 100)
      : 0;

    return {
      totalUsers,
      totalDays,
      totalContents,
      completedToday,
      totalCompletions,
      activeUsersWeek: activeUsersWeek.length,
      reflectionsCount,
      quizzesPassed,
      uniqueDaysCompleted: dayCompletions.length,
      avgProgress,
    };
  });

  app.get('/users', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const query = request.query as UserQuery;
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const search = query.search || '';

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true, role: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map(u => u.id);
    const progress = await prisma.userProgress.groupBy({
      by: ['userId'], where: { userId: { in: userIds }, status: 'COMPLETED' }, _count: true,
    });

    const progressMap = new Map(progress.map(p => [p.userId, p._count]));

    return { users: users.map(u => ({ ...u, completedCount: progressMap.get(u.id) || 0 })), total, page, totalPages: Math.ceil(total / limit) };
  });

  app.post('/users', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const body = createUserSchema.parse(request.body);

    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) return reply.code(409).send({ error: 'Email ya registrado' });
    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUsername) return reply.code(409).send({ error: 'Usuario ya existe' });

    const { hashPassword } = await import('../utils/auth.js');
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: { 
        email: body.email, 
        username: body.username, 
        passwordHash, 
        firstName: body.firstName, 
        lastName: body.lastName, 
        age: body.age, 
        country: body.country,
        role: body.role,
      },
      select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true, role: true, createdAt: true },
    });

    return { ...user, completedCount: 0 };
  });

  const updateUserSchema = z.object({
    email: z.string().email('Email inválido').optional(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    age: z.number().int().min(13).max(120).optional(),
    country: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  });

  app.put('/users/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as IdParams;
    const body = updateUserSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Usuario no encontrado' });

    if (body.email && body.email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email: body.email } });
      if (dup) return reply.code(409).send({ error: 'Email ya registrado' });
    }
    if (body.username && body.username !== existing.username) {
      const dup = await prisma.user.findUnique({ where: { username: body.username } });
      if (dup) return reply.code(409).send({ error: 'Usuario ya existe' });
    }

    const data: any = {};
    if (body.email !== undefined) data.email = body.email;
    if (body.username !== undefined) data.username = body.username;
    if (body.firstName !== undefined) data.firstName = body.firstName;
    if (body.lastName !== undefined) data.lastName = body.lastName;
    if (body.age !== undefined) data.age = body.age;
    if (body.country !== undefined) data.country = body.country;
    if (body.role !== undefined) data.role = body.role;

    if (body.password) {
      const { hashPassword } = await import('../utils/auth.js');
      data.passwordHash = await hashPassword(body.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true, role: true, createdAt: true },
    });

    return user;
  });

  app.get('/program/days', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    return prisma.programDay.findMany({ orderBy: { dayNumber: 'asc' }, include: { contents: { orderBy: { orderIndex: 'asc' } } } });
  });

  app.post('/program/days', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const body = createDaySchema.parse(request.body);
    const data = {
      dayNumber: body.dayNumber,
      title: body.title,
      description: body.description,
      unlockDate: body.unlockDate ? new Date(body.unlockDate) : undefined,
    };
    return prisma.programDay.create({ data });
  });

  app.put('/program/days/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as IdParams;
    const body = updateDaySchema.parse(request.body);
    const data: any = {};
    if (body.dayNumber !== undefined) data.dayNumber = body.dayNumber;
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.unlockDate !== undefined) data.unlockDate = new Date(body.unlockDate);
    const day = await prisma.programDay.update({ where: { id }, data });
    return day;
  });

  app.delete('/program/days/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as IdParams;
    await prisma.programDay.delete({ where: { id } });
    return { success: true };
  });

  app.post('/program/contents', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const body = createContentSchema.parse(request.body);
    const data = {
      dayId: body.dayId,
      type: body.type as ContentType,
      title: body.title,
      content: body.content,
      orderIndex: body.orderIndex,
      isRequired: body.isRequired,
    };
    return prisma.dayContent.create({ data });
  });

  app.put('/program/contents/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as IdParams;
    const body = updateContentSchema.parse(request.body);
    const data: any = {};
    if (body.type !== undefined) data.type = body.type as ContentType;
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.orderIndex !== undefined) data.orderIndex = body.orderIndex;
    if (body.isRequired !== undefined) data.isRequired = body.isRequired;
    return prisma.dayContent.update({ where: { id }, data });
  });

  app.delete('/program/contents/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as IdParams;
    await prisma.dayContent.delete({ where: { id } });
    return { success: true };
  });

  app.put('/program/days/:dayId/reorder', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { contentIds } = reorderContentsSchema.parse(request.body);
    await Promise.all(contentIds.map((id, index) => prisma.dayContent.update({ where: { id }, data: { orderIndex: index } })));
    return { success: true };
  });

  app.get('/analytics/overview', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const usersByDay = await prisma.userProgress.groupBy({ by: ['dayId'], where: { status: 'COMPLETED' }, _count: true });
    const dayMap = new Map((await prisma.programDay.findMany({ select: { id: true, dayNumber: true, title: true } })).map(d => [d.id, { dayNumber: d.dayNumber, title: d.title }]));
    const completionByDay = usersByDay.map(u => ({ dayNumber: dayMap.get(u.dayId)?.dayNumber, title: dayMap.get(u.dayId)?.title, completions: u._count })).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
    const recentUsers = await prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, username: true, firstName: true, lastName: true, createdAt: true } });
    return { completionByDay, recentUsers };
  });

  // ══════════════════════════════════════════════════════
  // NEGOCIO: pagos, comisiones, red y retiros
  // ══════════════════════════════════════════════════════

  interface SettingsResult {
    membershipPrice: number;
    monthlyFee: number;
    level1Percent: number;
    level2Percent: number;
  }

  async function getSettings(): Promise<SettingsResult> {
    const rows = await prisma.adminSetting.findMany();
    const map: Record<string, any> = {};
    for (const r of rows) {
      try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
    }
    return {
      membershipPrice: Number(map.MEMBERSHIP_PRICE ?? 500),
      monthlyFee: Number(map.MONTHLY_FEE ?? 50),
      level1Percent: Number(map.LEVEL1_PERCENT ?? 25),
      level2Percent: Number(map.LEVEL2_PERCENT ?? 5),
    };
  }

  // Configuración editable (precios y porcentajes)
  const settingsSchema = z.object({
    membershipPrice: z.number().positive().optional(),
    monthlyFee: z.number().positive().optional(),
    level1Percent: z.number().min(0).max(100).optional(),
    level2Percent: z.number().min(0).max(100).optional(),
  });

  app.get('/business/settings', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    return getSettings();
  });

  app.put('/business/settings', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const body = settingsSchema.parse(request.body);
    const entries = Object.entries(body);
    for (const [key, value] of entries) {
      await prisma.adminSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    }
    return getSettings();
  });

  // Pagos (membresía)
  app.get('/business/payments', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const payments = await prisma.membershipPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true, country: true } },
      },
    });
    return { payments };
  });

  interface PaymentParams { id: string; }

  // Aprobar pago → activa membresía + genera comisiones 2 niveles
  app.post('/business/payments/:id/approve', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as PaymentParams;
    const adminUser = (request as any).user as JWTPayload;

    try {
      await activateMembership(id, adminUser.sub);
    } catch (err: any) {
      if (err.message === 'Pago no encontrado') return reply.code(404).send({ error: err.message });
      if (err.message === 'Este pago ya fue procesado') return reply.code(400).send({ error: err.message });
      throw err;
    }

    return { success: true };
  });

  app.post('/business/payments/:id/reject', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as PaymentParams;
    const adminUser = (request as any).user as JWTPayload;
    const payment = await prisma.membershipPayment.findUnique({ where: { id } });
    if (!payment) return { error: 'Pago no encontrado' };
    if (payment.status !== 'PENDING') return { error: 'Este pago ya fue procesado' };
    await prisma.membershipPayment.update({
      where: { id },
      data: { status: 'REJECTED', processedAt: new Date(), processedBy: adminUser.sub },
    });
    return { success: true };
  });

  // Red global (todas las redes, para que el admin vea todo)
  app.get('/business/network', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, username: true, country: true, avatarUrl: true,
        membershipStatus: true, referralCode: true, referrerId: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return { users };
  });

  // Retiros
  app.get('/business/withdrawals', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, username: true, country: true } },
      },
    });
    return { withdrawals };
  });

  interface WithdrawalParams { id: string; }

  app.post('/business/withdrawals/:id/approve', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as WithdrawalParams;
    const adminUser = (request as any).user as JWTPayload;
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return reply.code(404).send({ error: 'Retiro no encontrado' });
    if (withdrawal.status !== 'PENDING') return reply.code(400).send({ error: 'Este retiro ya fue procesado' });

    const user = await prisma.user.findUnique({ where: { id: withdrawal.userId } });
    if (!user || user.balance < withdrawal.amount) {
      await prisma.withdrawal.update({
        where: { id },
        data: { status: 'REJECTED', processedAt: new Date(), processedBy: adminUser.sub },
      });
      return reply.code(400).send({ error: 'Saldo insuficiente, retiro rechazado automáticamente' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: withdrawal.userId }, data: { balance: { decrement: withdrawal.amount } } }),
      prisma.withdrawal.update({
        where: { id },
        data: { status: 'APPROVED', processedAt: new Date(), processedBy: adminUser.sub },
      }),
    ]);

    return { success: true };
  });

  app.post('/business/withdrawals/:id/reject', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as WithdrawalParams;
    const adminUser = (request as any).user as JWTPayload;
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) return { error: 'Retiro no encontrado' };
    if (withdrawal.status !== 'PENDING') return { error: 'Este retiro ya fue procesado' };
    await prisma.withdrawal.update({
      where: { id },
      data: { status: 'REJECTED', processedAt: new Date(), processedBy: adminUser.sub },
    });
    return { success: true };
  });
}