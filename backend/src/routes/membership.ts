import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createInvoice, getPaymentStatus, verifyWebhookSignature } from '../utils/nowpayments.js';
import { activateMembership } from '../utils/activation.js';
import { validateWithdrawalInput } from '../utils/withdrawals.js';

const defaults = {
  MEMBERSHIP_PRICE: 500,
  MONTHLY_FEE: 50,
  LEVEL1_PERCENT: 25,
  LEVEL2_PERCENT: 5,
};

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

async function getSettings() {
  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }

  let plans = defaultPlans();
  if (map.PLANS) {
    try {
      const parsed = JSON.parse(map.PLANS);
      if (Array.isArray(parsed) && parsed.length) plans = parsed;
    } catch { /* usar default */ }
  } else if (map.MEMBERSHIP_PRICE && Number(map.MEMBERSHIP_PRICE) !== 500) {
    plans = [{ id: 'plan', name: 'Membresía', price: Number(map.MEMBERSHIP_PRICE) }];
  }

  return {
    membershipPrice: Number(map.MEMBERSHIP_PRICE ?? defaults.MEMBERSHIP_PRICE),
    monthlyFee: Number(map.MONTHLY_FEE ?? defaults.MONTHLY_FEE),
    level1Percent: Number(map.LEVEL1_PERCENT ?? defaults.LEVEL1_PERCENT),
    level2Percent: Number(map.LEVEL2_PERCENT ?? defaults.LEVEL2_PERCENT),
    plans,
  };
}

function defaultPlans() {
  return [
    { id: 'estandar', name: 'Estándar', price: 500 },
    { id: 'elite', name: 'Élite', price: 1000 },
  ];
}

const GRACE_DAYS = 3;
const MEMBERSHIP_DAYS = 30;

// Estado efectivo: ACTIVE mientras dure, GRACE en los 3 días tras vencer (aún accede), EXPIRED después.
function effectiveMembership(user: {
  membershipStatus: string;
  membershipExpiresAt: Date | null;
}): { status: string; expiresAt: Date | null; graceEndsAt: Date | null } {
  if (user.membershipStatus !== 'ACTIVE' || !user.membershipExpiresAt) {
    return { status: user.membershipStatus, expiresAt: user.membershipExpiresAt, graceEndsAt: null };
  }
  const now = new Date();
  const expiresAt = user.membershipExpiresAt;
  const graceEndsAt = new Date(expiresAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
  if (now <= expiresAt) return { status: 'ACTIVE', expiresAt, graceEndsAt };
  if (now <= graceEndsAt) return { status: 'GRACE', expiresAt, graceEndsAt };
  return { status: 'EXPIRED', expiresAt, graceEndsAt };
}

export async function membershipRoutes(app: FastifyInstance) {
  // ─── Estado de membresía + comisiones para el usuario ───
  app.get('/status', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        membershipStatus: true,
        membershipPaidAt: true,
        membershipExpiresAt: true,
        balance: true,
        referralCode: true,
        referrerId: true,
      },
    });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    const webBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const settings = await getSettings();
    const eff = effectiveMembership(user);

    return {
      status: eff.status,
      paidAt: user.membershipPaidAt,
      expiresAt: eff.expiresAt,
      graceEndsAt: eff.graceEndsAt,
      balance: user.balance,
      referralCode: user.referralCode,
      referralLink: user.referralCode ? `${webBase}/register?ref=${user.referralCode}` : null,
      referrerId: user.referrerId,
      settings,
    };
  });

  // ─── Solicitar pago de membresía (plan elegido, vía NowPayments) ───
  const requestPaymentSchema = z.object({
    method: z.string().optional(),
    reference: z.string().optional(),
    planId: z.string().optional(),
  });

  app.post('/membership/payment/request', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = requestPaymentSchema.parse(request.body);
    const settings = await getSettings();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });
    if (user.membershipStatus === 'ACTIVE') return reply.code(400).send({ error: 'Tu membresía ya está activa' });

    const existingPending = await prisma.membershipPayment.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existingPending) return reply.code(400).send({ error: 'Ya tienes un pago pendiente de aprobación' });

    const plan = settings.plans.find((p: any) => p.id === body.planId) || settings.plans[0];
    if (!plan) return reply.code(400).send({ error: 'No hay planes disponibles' });

    const payment = await prisma.membershipPayment.create({
      data: {
        userId,
        amount: plan.price,
        type: 'MEMBERSHIP',
        status: 'PENDING',
        method: body.method,
        reference: body.reference,
        planId: plan.id,
        planName: plan.name,
      },
    });

    // Crear invoice en NowPayments para que el usuario pague con cripto.
    let invoiceUrl: string | null = null;
    if (config.nowpayments.apiKey) {
      try {
        const invoice = await createInvoice({
          priceAmount: payment.amount,
          priceCurrency: 'usd',
          orderId: `c1-${payment.id}`,
          orderDescription: `Membresía Círculo 1 - ${user.firstName} ${user.lastName || ''}`.trim(),
          successUrl: `${config.frontendUrl}/program`,
          cancelUrl: `${config.frontendUrl}/program`,
          ipnCallbackUrl: `${config.backendUrl}/api/membership/payments/webhook`,
        });
        invoiceUrl = invoice.invoiceUrl;
        await prisma.membershipPayment.update({
          where: { id: payment.id },
          data: {
            npPaymentId: String(invoice.paymentId),
            npInvoiceUrl: invoice.invoiceUrl,
            npStatus: invoice.paymentStatus,
          },
        });
      } catch (err: any) {
        request.log.warn({ err }, 'No se pudo crear el invoice de NowPayments');
        return reply.code(502).send({ error: 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.' });
      }
    }

    return { payment, invoiceUrl, settings };
  });

  // ─── Solicitar pago de la cuota mensual ($50, renovación, vía NowPayments) ───
  const requestMonthlySchema = z.object({
    method: z.string().optional(),
    reference: z.string().optional(),
  });

  app.post('/monthly/payment/request', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = requestMonthlySchema.parse(request.body);
    const settings = await getSettings();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    const eff = effectiveMembership(user);
    if (eff.status === 'ACTIVE') return reply.code(400).send({ error: 'Tu membresía aún está vigente' });
    if (eff.status === 'INACTIVE') return reply.code(400).send({ error: 'Debes activar primero tu membresía' });

    const existingPending = await prisma.membershipPayment.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existingPending) return reply.code(400).send({ error: 'Ya tienes un pago pendiente de aprobación' });

    const payment = await prisma.membershipPayment.create({
      data: {
        userId,
        amount: settings.monthlyFee,
        type: 'MONTHLY',
        status: 'PENDING',
        method: body.method,
        reference: body.reference,
      },
    });

    let invoiceUrl: string | null = null;
    if (config.nowpayments.apiKey) {
      try {
        const invoice = await createInvoice({
          priceAmount: payment.amount,
          priceCurrency: 'usd',
          orderId: `c1-${payment.id}`,
          orderDescription: `Cuota mensual Círculo 1 - ${user.firstName} ${user.lastName || ''}`.trim(),
          successUrl: `${config.frontendUrl}/program`,
          cancelUrl: `${config.frontendUrl}/program`,
          ipnCallbackUrl: `${config.backendUrl}/api/membership/payments/webhook`,
        });
        invoiceUrl = invoice.invoiceUrl;
        await prisma.membershipPayment.update({
          where: { id: payment.id },
          data: {
            npPaymentId: String(invoice.paymentId),
            npInvoiceUrl: invoice.invoiceUrl,
            npStatus: invoice.paymentStatus,
          },
        });
      } catch (err: any) {
        request.log.warn({ err }, 'No se pudo crear el invoice de NowPayments');
        return reply.code(502).send({ error: 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.' });
      }
    }

    return { payment, invoiceUrl, settings };
  });

  // ─── Webhook IPN de NowPayments (público, verificado por firma) ───
  const FINAL_STATUSES = ['confirmed', 'finished'];

  async function applyNowPaymentsStatus(paymentId: string, npStatus: string) {
    const payment = await prisma.membershipPayment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    if (payment.npStatus === npStatus && payment.status !== 'PENDING') return;

    await prisma.membershipPayment.update({
      where: { id: paymentId },
      data: { npStatus },
    });

    if (payment.status === 'PENDING' && FINAL_STATUSES.includes(npStatus)) {
      await activateMembership(paymentId, 'nowpayments');
    }
  }

  // El webhook necesita el body crudo para validar la firma HMAC, así que
  // registramos la ruta en un contexto con parser de string.
  await app.register(async (instance) => {
    instance.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => done(null, body));

    instance.post('/payments/webhook', async (request, reply) => {
      const rawBody = (request.body as string) ?? '';
      const signature = (request.headers['x-nowpayments-sig'] as string) || '';

      if (!verifyWebhookSignature(rawBody, signature)) {
        return reply.code(401).send({ error: 'Firma inválida' });
      }

      let payload: any;
      try { payload = JSON.parse(rawBody); } catch { return reply.code(400).send({ error: 'Body inválido' }); }

      // order_id llega con prefijo único del proyecto (c1-...) para identificar sus pagos.
      const rawOrderId = (payload.order_id as string) || '';
      const paymentId = rawOrderId.startsWith('c1-') ? rawOrderId.slice(3) : rawOrderId;
      const npStatus = payload.payment_status as string;
      if (!paymentId || !npStatus) return reply.code(200).send({ ok: true });

      try {
        await applyNowPaymentsStatus(paymentId, npStatus);
      } catch (err: any) {
        request.log.error({ err }, 'Error procesando webhook NowPayments');
      }

      return { ok: true };
    });
  });

  // ─── Estado de un pago (para polling del frontend) ───
  app.get('/payments/:id/status', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const payment = await prisma.membershipPayment.findUnique({ where: { id } });
    if (!payment) return reply.code(404).send({ error: 'Pago no encontrado' });
    if (payment.userId !== userId) return reply.code(403).send({ error: 'No autorizado' });

    if (payment.npPaymentId && payment.status === 'PENDING' && config.nowpayments.apiKey) {
      try {
        const status = await getPaymentStatus(Number(payment.npPaymentId));
        await applyNowPaymentsStatus(payment.id, status.payment_status);
        const updated = await prisma.membershipPayment.findUnique({ where: { id } });
        return { payment: updated };
      } catch (err: any) {
        request.log.warn({ err }, 'No se pudo consultar estado NowPayments');
        return { payment };
      }
    }

    return { payment };
  });
  app.get('/earnings', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
    const commissions = await prisma.commission.findMany({
      where: { userId, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceUser: { select: { firstName: true, lastName: true, username: true } },
        payment: { select: { amount: true, createdAt: true, processedAt: true } },
      },
    });
    const retained = await prisma.commission.findMany({
      where: { userId, status: 'RETENTED' },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceUser: { select: { firstName: true, lastName: true, username: true } },
        payment: { select: { amount: true, createdAt: true, processedAt: true } },
      },
    });

    const totalEarned = await prisma.commission.aggregate({ where: { userId, status: 'PAID' }, _sum: { amount: true } });
    const retainedTotal = await prisma.commission.aggregate({ where: { userId, status: 'RETENTED' }, _sum: { amount: true } });
    const pending = await prisma.commission.aggregate({
      where: { userId, status: 'PAID', payment: { status: 'PENDING' } },
      _sum: { amount: true },
    });

    return {
      balance: user?.balance ?? 0,
      totalEarned: totalEarned._sum.amount ?? 0,
      pendingApproval: pending._sum.amount ?? 0,
      retainedTotal: retainedTotal._sum.amount ?? 0,
      commissions,
      retained,
    };
  });

  // ─── Mi red unilevel (hasta 2 niveles abajo) ───
  app.get('/network', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;

    const direct = await prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true, firstName: true, lastName: true, username: true, country: true, avatarUrl: true,
        membershipStatus: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const directIds = direct.map(u => u.id);
    const indirect = directIds.length > 0
      ? await prisma.user.findMany({
          where: { referrerId: { in: directIds } },
          select: {
            id: true, firstName: true, lastName: true, username: true, country: true, avatarUrl: true,
            membershipStatus: true, createdAt: true, referrerId: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const directJustUsernames = direct.map(u => ({ id: u.id, name: u.username }));
    const indirectWithParent = indirect.map(u => ({
      ...u,
      parentId: u.referrerId,
    }));

    // Comisiones ganadas por el usuario, agrupadas por el referido que pagó (sourceUserId).
    const earnedBySource = await prisma.commission.groupBy({
      by: ['sourceUserId'],
      where: { userId, status: 'PAID' },
      _sum: { amount: true },
    });
    const earnedMap: Record<string, number> = {};
    for (const e of earnedBySource) {
      earnedMap[e.sourceUserId] = Math.round((e._sum.amount ?? 0) * 100) / 100;
    }

    const withEarned = (list: any[]) => list.map(u => ({ ...u, earned: earnedMap[u.id] || 0 }));

    return {
      count: { level1: direct.length, level2: indirect.length, total: direct.length + indirect.length },
      level1: withEarned(direct),
      level2: withEarned(indirectWithParent),
      directIds: directJustUsernames,
    };
  });

  // ─── Notificaciones ───
  app.get('/notifications', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const unread = await prisma.notification.count({ where: { userId, read: false } });
    return { notifications, unread };
  });

  app.post('/notifications/read', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  });

  // ─── Solicitudes de retiro ───
  const withdrawalSchema = z.object({
    amount: z.number().positive(),
    method: z.enum(['USDT_BEP20', 'MATIC_POLYGON', 'BANK_US']),
    account: z.string().max(200).optional(),
    details: z.any().optional(),
  });

  app.post('/withdrawals', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = withdrawalSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    const pending = await prisma.withdrawal.findFirst({ where: { userId, status: 'PENDING' } });
    if (pending) return reply.code(400).send({ error: 'Ya tienes una solicitud de retiro pendiente. Espérala a ser aprobada o rechazada.' });

    if (body.amount > user.balance) return reply.code(400).send({ error: 'No tienes suficiente saldo disponible' });

    const invalid = validateWithdrawalInput(body.method, body.account, body.details);
    if (invalid) return reply.code(400).send({ error: invalid });

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: body.amount,
        method: body.method,
        account: body.method === 'BANK_US' ? undefined : body.account,
        details: body.method === 'BANK_US' ? body.details : undefined,
      },
    });

    return { withdrawal };
  });

  app.get('/withdrawals', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { withdrawals };
  });

  // ─── Cuentas guardadas (wallets / banco) ───
  const payoutAccountSchema = z.object({
    method: z.enum(['USDT_BEP20', 'MATIC_POLYGON', 'BANK_US']),
    label: z.string().max(60).optional(),
    address: z.string().max(200).optional(),
    details: z.any().optional(),
  });

  app.get('/payout-accounts', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const accounts = await prisma.payoutAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { accounts };
  });

  app.post('/payout-accounts', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = payoutAccountSchema.parse(request.body);

    const invalid = validateWithdrawalInput(body.method, body.address, body.details);
    if (invalid) return reply.code(400).send({ error: invalid });

    const account = await prisma.payoutAccount.create({
      data: {
        userId,
        method: body.method,
        label: body.label?.trim() || null,
        address: body.method === 'BANK_US' ? undefined : body.address,
        details: body.method === 'BANK_US' ? body.details : undefined,
      },
    });
    return { account };
  });

  app.delete('/payout-accounts/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const account = await prisma.payoutAccount.findFirst({ where: { id, userId } });
    if (!account) return reply.code(404).send({ error: 'Cuenta no encontrada' });
    await prisma.payoutAccount.delete({ where: { id } });
    return { ok: true };
  });
}