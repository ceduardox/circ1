import { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'url';
import path from 'path';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { ContentType } from '@prisma/client';
import { activateMembership } from '../utils/activation.js';
import { getPaymentStatus } from '../utils/nowpayments.js';
import { config } from '../config/index.js';
import { generateReferralCode } from '../utils/auth.js';
import { sendWebPush } from '../utils/onesignal.js';
import { transcribeAudio, downloadAudioToBuffer, downloadVideoToFile, MAX_DURATION_SEC } from '../utils/transcribe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        select: { id: true, email: true, username: true, firstName: true, lastName: true, country: true, role: true, createdAt: true, balance: true },
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
        referralCode: generateReferralCode(body.username),
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

  // ─── Usuarios atascados (membresía activa pero sin completar tareas hace N días) ───
  app.get('/business/stuck-users', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const days = Number((request.query as any).days ?? 3);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activeUsers = await prisma.user.findMany({
      where: { membershipStatus: 'ACTIVE', role: 'USER' },
      select: { id: true, firstName: true, lastName: true, username: true, email: true, createdAt: true },
    });

    const userIds = activeUsers.map(u => u.id);
    const recentProgress = await prisma.userProgress.findMany({
      where: { userId: { in: userIds }, completedAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const activeSet = new Set(recentProgress.map(p => p.userId));

    const stuck = activeUsers
      .filter(u => !activeSet.has(u.id))
      .map(u => ({ ...u, lastActivity: null }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { stuck, since, days };
  });

  // ─── Embudo: registrados → con membresía → activos → activos hoy ───
  app.get('/business/funnel', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const withMembership = await prisma.user.count({ where: { role: 'USER', membershipStatus: 'ACTIVE' } });
    const activeToday = (await prisma.userProgress.findMany({
      where: { completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      select: { userId: true },
      distinct: ['userId'],
    })).length;
    return {
      funnel: { registered: totalUsers, withMembership, activeToday },
      rates: {
        conversionToMembership: totalUsers > 0 ? Math.round((withMembership / totalUsers) * 100) : 0,
        retentionToday: withMembership > 0 ? Math.round((activeToday / withMembership) * 100) : 0,
      },
    };
  });

  // ══════════════════════════════════════════════════════
  // NEGOCIO: pagos, comisiones, red y retiros
  // ══════════════════════════════════════════════════════

  interface SettingsResult {
    membershipPrice: number;
    monthlyFee: number;
    level1Percent: number;
    level2Percent: number;
    paymentCurrency: string;
    registerOpen: boolean;
    plans: { id: string; name: string; price: number }[];
  }

  async function getSettings(): Promise<SettingsResult> {
    const rows = await prisma.adminSetting.findMany();
    const map: Record<string, any> = {};
    for (const r of rows) {
      try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
    }

    let plans = [
      { id: 'estandar', name: 'Estándar', price: 500 },
      { id: 'elite', name: 'Élite', price: 1000 },
    ];
    if (map.PLANS) {
      try {
        const parsed = JSON.parse(map.PLANS);
        if (Array.isArray(parsed) && parsed.length) plans = parsed;
      } catch { /* usar default */ }
    } else if (map.MEMBERSHIP_PRICE && Number(map.MEMBERSHIP_PRICE) !== 500) {
      plans = [{ id: 'plan', name: 'Membresía', price: Number(map.MEMBERSHIP_PRICE) }];
    }

    return {
      membershipPrice: Number(map.MEMBERSHIP_PRICE ?? 500),
      monthlyFee: Number(map.MONTHLY_FEE ?? 50),
      level1Percent: Number(map.LEVEL1_PERCENT ?? 25),
      level2Percent: Number(map.LEVEL2_PERCENT ?? 5),
      paymentCurrency: map.PAYMENT_CURRENCY || 'usdtbsc',
      registerOpen: map.REGISTER_OPEN === undefined ? true : map.REGISTER_OPEN !== false,
      plans,
    };
  }

  // Configuración editable (precios y porcentajes)
  const settingsSchema = z.object({
    membershipPrice: z.number().positive().optional(),
    monthlyFee: z.number().positive().optional(),
    level1Percent: z.number().min(0).max(100).optional(),
    level2Percent: z.number().min(0).max(100).optional(),
    paymentCurrency: z.string().optional(),
    registerOpen: z.boolean().optional(),
    plans: z.array(z.object({
      id: z.string(),
      name: z.string().min(1),
      price: z.number().positive(),
    })).optional(),
  });

  app.get('/business/settings', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    return getSettings();
  });

  app.put('/business/settings', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const body = settingsSchema.parse(request.body);
    const entries = Object.entries(body) as [string, any][];
    // Mapea el nombre del campo a la key usada en la BD (REGISTER_OPEN en mayúsculas).
    const keyMap: Record<string, string> = { registerOpen: 'REGISTER_OPEN' };
    for (const [key, value] of entries) {
      const dbKey = keyMap[key] || key;
      await prisma.adminSetting.upsert({
        where: { key: dbKey },
        update: { value: JSON.stringify(value) },
        create: { key: dbKey, value: JSON.stringify(value) },
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

  // Comisiones retenidas por el sistema (referrer no estaba al día): el admin ve el total y el detalle.
  app.get('/business/retained', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const retained = await prisma.commission.findMany({
      where: { status: 'RETENTED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, username: true } },
        sourceUser: { select: { firstName: true, lastName: true, username: true } },
      },
    });
    const total = retained.reduce((sum, c) => sum + c.amount, 0);
    return { total, retained };
  });

  // Verificación manual: reconsulta el estado en NowPayments y, si está confirmado, activa.
  app.post('/business/payments/:id/verify', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as PaymentParams;
    const payment = await prisma.membershipPayment.findUnique({ where: { id }, include: { user: true } });
    if (!payment) return reply.code(404).send({ error: 'Pago no encontrado' });
    if (payment.status !== 'PENDING' || !payment.npPaymentId) {
      return reply.code(400).send({ error: 'Este pago no está pendiente de NowPayments' });
    }
    if (!config.nowpayments.apiKey) {
      return reply.code(400).send({ error: 'NowPayments no está configurado' });
    }

    const FINAL = ['confirmed', 'finished'];
    let npStatus: string;
    try {
      const status = await getPaymentStatus(Number(payment.npPaymentId));
      npStatus = status.payment_status;
    } catch (err: any) {
      request.log.warn({ err }, 'Error consultando NowPayments');
      return reply.code(502).send({ error: 'No se pudo consultar NowPayments' });
    }

    await prisma.membershipPayment.update({ where: { id }, data: { npStatus } });

    if (FINAL.includes(npStatus)) {
      try {
        await activateMembership(id, 'nowpayments-verify');
        return { verified: true, npStatus, activated: true };
      } catch (err: any) {
        return { verified: true, npStatus, activated: false, error: err.message };
      }
    }

    return { verified: true, npStatus, activated: false };
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

  // Desactivar membresía de un pago aprobado: revierte todo como si no hubiera pagado.
  app.post('/business/payments/:id/deactivate', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as PaymentParams;
    const adminUser = (request as any).user as JWTPayload;
    const payment = await prisma.membershipPayment.findUnique({ where: { id }, include: { user: true } });
    if (!payment) return reply.code(404).send({ error: 'Pago no encontrado' });
    if (payment.status !== 'APPROVED') return reply.code(400).send({ error: 'Solo se puede desactivar un pago aprobado' });

    await prisma.$transaction(async (tx) => {
      // Revierte las comisiones que este pago generó.
      const commissions = await tx.commission.findMany({ where: { paymentId: id } });
      for (const c of commissions) {
        if (c.status === 'RETENTED') continue;
        await tx.user.update({
          where: { id: c.userId },
          data: { balance: { decrement: c.amount } },
        });
      }
      await tx.commission.deleteMany({ where: { paymentId: id } });

      // La membresía del usuario vuelve a estar sin pagar.
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          membershipStatus: 'INACTIVE',
          membershipPaidAt: null,
          membershipExpiresAt: null,
        },
      });

      await tx.membershipPayment.update({
        where: { id },
        data: { status: 'REJECTED', processedAt: new Date(), processedBy: adminUser.sub },
      });
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
    const body = (request.body as any) || {};
    const feePercent = body.feePercent == null ? 0 : Number(body.feePercent);
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      return reply.code(400).send({ error: 'El fee de retiro debe estar entre 0 y 100%' });
    }
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
        data: { status: 'APPROVED', feePercent, processedAt: new Date(), processedBy: adminUser.sub },
      }),
    ]);

    const afterDebit = await prisma.user.findUnique({ where: { id: withdrawal.userId }, select: { balance: true } });
    await prisma.balanceLog.create({
      data: {
        userId: withdrawal.userId,
        type: 'debit',
        amount: withdrawal.amount,
        balance: afterDebit?.balance ?? 0,
        note: `Retiro aprobado${feePercent > 0 ? ` con fee ${feePercent}%` : ''}`,
      },
    });

    // Notificación en app + web push si el usuario lo tiene activo.
    try {
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Retiro aprobado',
          message: feePercent > 0
            ? `Tu retiro de ${withdrawal.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} fue aprobado (comisión ${feePercent}%).`
            : `Tu retiro de ${withdrawal.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} fue aprobado.`,
        },
      });
      const pref = await prisma.user.findUnique({ where: { id: withdrawal.userId }, select: { pushEnabled: true, pushPayments: true } });
      if (pref?.pushEnabled && pref.pushPayments) {
        await sendWebPush({
          externalUserIds: [withdrawal.userId],
          title: 'Retiro aprobado',
          message: `Tu retiro de ${withdrawal.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} fue aprobado.`,
        });
      }
    } catch {
      // no romper la aprobación si falla la notificación
    }

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

  // Historial de balance de un usuario
  app.get('/business/balance-log/:userId', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { userId } = request.params as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true, balance: true },
    });
    if (!user) return { error: 'Usuario no encontrado' };
    const logs = await prisma.balanceLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { user, logs };
  });

  // ══════════════════════════════════════════════════════
  // TRANSCRIPCIÓN: link de video (Facebook, etc.) → texto
  // ══════════════════════════════════════════════════════

  const transcribeSchema = z.object({ url: z.string().url() });

  // Crear job de transcripción (procesa en background, sin bloquear)
  app.post('/transcribe', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { url } = transcribeSchema.parse(request.body);
    const isFacebook = /facebook\.com|fb\.watch|fb\.com/.test(url);
    if (!isFacebook) {
      return reply.code(400).send({ error: 'Solo se aceptan links de Facebook' });
    }

    const record = await prisma.transcription.create({
      data: { url, status: 'PROCESSING' },
    });

    // Procesar en segundo plano: no esperamos la descarga+whisper (puede tardar).
    void (async () => {
      try {
        // 1) Descargar el video completo a uploads/videos para reproducirlo en la app.
        const destDir = path.join(__dirname, '..', '..', 'uploads', 'videos');
        const video = await downloadVideoToFile(url, destDir, `${record.id}.mp4`);

        // 2) Transcribir el audio (en memoria, no toca disco).
        const audio = await downloadAudioToBuffer(url);
        if (audio.duration > MAX_DURATION_SEC) {
          throw new Error(`El video dura más de ${MAX_DURATION_SEC / 60} min. Usa uno más corto.`);
        }
        const text = await transcribeAudio(audio.buffer, 'audio.mp3');

        await prisma.transcription.update({
          where: { id: record.id },
          data: {
            status: 'DONE',
            text,
            title: video.title || audio.title || null,
            durationSec: Math.round(video.duration || audio.duration),
            videoPath: `/uploads/videos/${record.id}.mp4`,
          },
        });
      } catch (err: any) {
        await prisma.transcription.update({
          where: { id: record.id },
          data: { status: 'FAILED', error: err?.message || 'Error desconocido' },
        });
      }
    })();

    return { transcription: { id: record.id, status: record.status } };
  });

  // Estado y resultado de un job
  app.get('/transcribe/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await prisma.transcription.findUnique({ where: { id } });
    if (!record) return reply.code(404).send({ error: 'Transcripción no encontrada' });
    return { transcription: record };
  });

  // Listado reciente
  app.get('/transcribe', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const transcriptions = await prisma.transcription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return { transcriptions };
  });
}
