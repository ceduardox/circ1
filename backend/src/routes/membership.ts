import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createInvoice, getPaymentStatus, verifyWebhookSignature } from '../utils/nowpayments.js';
import { activateMembership } from '../utils/activation.js';

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
  return {
    membershipPrice: Number(map.MEMBERSHIP_PRICE ?? defaults.MEMBERSHIP_PRICE),
    monthlyFee: Number(map.MONTHLY_FEE ?? defaults.MONTHLY_FEE),
    level1Percent: Number(map.LEVEL1_PERCENT ?? defaults.LEVEL1_PERCENT),
    level2Percent: Number(map.LEVEL2_PERCENT ?? defaults.LEVEL2_PERCENT),
  };
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

  // ─── Solicitar pago de membresía ($500, vía NowPayments) ───
  const requestPaymentSchema = z.object({
    method: z.string().optional(),
    reference: z.string().optional(),
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

    const payment = await prisma.membershipPayment.create({
      data: {
        userId,
        amount: settings.membershipPrice,
        type: 'MEMBERSHIP',
        status: 'PENDING',
        method: body.method,
        reference: body.reference,
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
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sourceUser: { select: { firstName: true, lastName: true, username: true } },
        payment: { select: { amount: true, createdAt: true, processedAt: true } },
      },
    });

    const totalEarned = await prisma.commission.aggregate({ where: { userId }, _sum: { amount: true } });
    const pending = await prisma.commission.aggregate({
      where: { userId, payment: { status: 'PENDING' } },
      _sum: { amount: true },
    });

    return {
      balance: user?.balance ?? 0,
      totalEarned: totalEarned._sum.amount ?? 0,
      pendingApproval: pending._sum.amount ?? 0,
      commissions,
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

    return {
      count: { level1: direct.length, level2: indirect.length, total: direct.length + indirect.length },
      level1: direct,
      level2: indirectWithParent,
      directIds: directJustUsernames,
    };
  });

  // ─── Solicitudes de retiro ───
  const withdrawalSchema = z.object({
    amount: z.number().positive(),
    method: z.string().max(100).optional(),
    account: z.string().max(200).optional(),
  });

  app.post('/withdrawals', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = withdrawalSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    const pending = await prisma.withdrawal.findFirst({ where: { userId, status: 'PENDING' } });
    if (pending) return reply.code(400).send({ error: 'Ya tienes una solicitud de retiro pendiente. Espérala a ser aprobada o rechazada.' });

    if (body.amount > user.balance) return reply.code(400).send({ error: 'No tienes suficiente saldo disponible' });

    const withdrawal = await prisma.withdrawal.create({
      data: { userId, amount: body.amount, method: body.method, account: body.account },
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
}