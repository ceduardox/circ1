import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createInvoice, getPaymentStatus, verifyWebhookSignature } from '../utils/nowpayments.js';
import { activateMembership } from '../utils/activation.js';
import { activateCreatorExtra } from '../utils/tiktok.js';
import { sendWebPush } from '../utils/onesignal.js';
import { validateWithdrawalInput } from '../utils/withdrawals.js';

const defaults = {
  MEMBERSHIP_PRICE: 500,
  MONTHLY_FEE: 50,
  LEVEL1_PERCENT: 25,
  LEVEL2_PERCENT: 5,
};

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

// Notifica por push a todos los admins cuando ocurre un evento importante (ej. intento de pago).
async function notifyAdmins(title: string, message: string) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    if (admins.length === 0) return;
    await sendWebPush({
      externalUserIds: admins.map(a => a.id),
      title,
      message,
      url: '/admin/withdrawals',
    });
  } catch (e) {
    console.error('Error notificando a admins:', e);
  }
}

async function getSettings(userPlans?: string[]) {
  const rows = await prisma.adminSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value as any); } catch { map[r.key] = r.value; }
  }

  let plans = defaultPlans();
  const plansRaw = map.PLANS ?? map.plans;
  if (plansRaw) {
    if (Array.isArray(plansRaw) && plansRaw.length) {
      plans = plansRaw;
    } else if (typeof plansRaw === 'string') {
      try {
        const parsed = JSON.parse(plansRaw);
        if (Array.isArray(parsed) && parsed.length) plans = parsed;
      } catch { /* usar default */ }
    }
  } else if (map.MEMBERSHIP_PRICE ?? map.membershipPrice) {
    plans = [{ id: 'plan', name: 'Membresía', price: Number(map.MEMBERSHIP_PRICE ?? map.membershipPrice), tiktok: true }];
  }

  // Por defecto los planes incluyen TikTok Shop salvo que el admin lo desmarque.
  plans = plans.map((p: any) => ({ ...p, tiktok: p.tiktok !== false }));

  // Filtra los planes según los que el referidor asignó a este usuario.
  // userPlans ej: ["estandar","elite"] = ambos · ["estandar"] = solo 500 · ["elite"] = solo 1000
  // Si el usuario no tiene referralPlans definidos (null), se muestran todos los planes.
  if (Array.isArray(userPlans) && userPlans.length > 0) {
    const filtered = plans.filter((p: any) => userPlans.includes(p.id));
    if (filtered.length > 0) plans = filtered;
  }

  return {
    membershipPrice: Number(map.MEMBERSHIP_PRICE ?? map.membershipPrice ?? defaults.MEMBERSHIP_PRICE),
    monthlyFee: Number(map.MONTHLY_FEE ?? map.monthlyFee ?? defaults.MONTHLY_FEE),
    level1Percent: Number(map.LEVEL1_PERCENT ?? map.level1Percent ?? defaults.LEVEL1_PERCENT),
    level2Percent: Number(map.LEVEL2_PERCENT ?? map.level2Percent ?? defaults.LEVEL2_PERCENT),
    paymentCurrency: (map.PAYMENT_CURRENCY ?? map.paymentCurrency) || 'usdtbsc',
    plans,
    bankDetails: map.BANK_DETAILS ?? {
      holder: 'Jose Eduardo Callau Silva',
      routing: '101019644',
      account: '218557388248',
      accountType: 'Checking (Corriente o Cheques)',
      bank: 'Lead Bank',
      address: '1801 Main St., Kansas City, MO 64108',
    },
  };
}

function defaultPlans() {
  return [
    { id: 'estandar', name: 'Estándar', price: 500, tiktok: true },
    { id: 'elite', name: 'Élite', price: 1000, tiktok: true },
  ];
}

const GRACE_DAYS = 3;
const MEMBERSHIP_DAYS = 30;

// Tiempo máximo que un pago queda "pendiente" antes de poder reintentar.
// Si el usuario pide el pago y no lo completa, expira y puede intentarlo de nuevo.
const PAYMENT_TTL_MINUTES = 30;

// Encuentra el pago pendiente vigente del usuario (no expirado).
// Si había uno expirado, lo marca como expirado en la BD para no bloquear.
async function getActivePendingPayment(userId: string) {
  const pending = await prisma.membershipPayment.findFirst({
    where: { userId, status: 'PENDING', type: { in: ['MEMBERSHIP', 'MONTHLY'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!pending) return null;

  const expiresAt = pending.expiresAt ?? new Date(pending.createdAt.getTime() + PAYMENT_TTL_MINUTES * 60 * 1000);
  const now = new Date();

  if (expiresAt <= now) {
    // Expirado: se marca como tal y se libera el reintento.
    await prisma.membershipPayment.update({
      where: { id: pending.id },
      data: { status: 'REJECTED', npStatus: pending.npStatus ?? 'expired', reference: pending.reference ?? 'expirado' },
    });
    return null;
  }

  return { payment: pending, expiresAt };
}

// Estado efectivo: ACTIVE mientras dure, GRACE en los 3 días tras vencer (aún accede), EXPIRED después.
// Los admins SIEMPRE cuentan como ACTIVE (licencia activa).
function effectiveMembership(user: {
  membershipStatus: string;
  membershipExpiresAt: Date | null;
  role?: string;
}): { status: string; expiresAt: Date | null; graceEndsAt: Date | null } {
  if (user.role === 'ADMIN') {
    return { status: 'ACTIVE', expiresAt: null, graceEndsAt: null };
  }
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
        referralPlans: true,
        role: true,
      },
    });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    const webBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const settings = await getSettings((user.referralPlans as string[] | null) ?? undefined);
    const eff = effectiveMembership(user);

    // Pack adquirido: del último pago de membresía aprobado (plan o monto).
    const lastPaid = await prisma.membershipPayment.findFirst({
      where: { userId, type: 'MEMBERSHIP', status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
    const pack = lastPaid
      ? {
          planId: lastPaid.planId,
          planName: lastPaid.planName,
          price: lastPaid.amount,
          packType: lastPaid.planId === 'elite' || lastPaid.amount >= 1000 ? 1000 : 500,
          method: lastPaid.method,
          paidAt: lastPaid.processedAt ?? lastPaid.createdAt,
        }
      : null;

    // Acceso a TikTok Shop: solo si el plan del usuario lo incluye (checkbox en config).
    const plan = pack?.planId ? settings.plans.find((p: any) => p.id === pack.planId) : null;
    const tiktokAccess = plan ? plan.tiktok !== false : true;

    return {
      status: eff.status,
      paidAt: user.membershipPaidAt,
      expiresAt: eff.expiresAt,
      graceEndsAt: eff.graceEndsAt,
      balance: user.balance,
      referralCode: user.referralCode,
      referralLink: user.referralCode ? `${webBase}/register?ref=${user.referralCode}` : null,
      referrerId: user.referrerId,
      referralPlans: (user.referralPlans as string[] | null) ?? ['estandar', 'elite'],
      pack: pack ? { ...pack, tiktokAccess } : null,
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

    // Métodos manuales (tarjeta Whop / banco): si hay un pago pendiente anterior
    // (ej. el usuario intentó cripto y quiere cambiar), se cancela para poder crear el nuevo.
    const isManualMethod = body.method === 'whop' || body.method === 'bank';
    if (isManualMethod) {
      await prisma.membershipPayment.updateMany({
        where: { userId, status: 'PENDING', type: { in: ['MEMBERSHIP', 'MONTHLY'] } },
        data: { status: 'REJECTED', reference: 'cambiado-de-metodo' },
      });
    }

    const activePending = await getActivePendingPayment(userId);
    if (activePending) {
      const remainingMin = Math.ceil((activePending.expiresAt.getTime() - Date.now()) / 60000);
      return reply.code(400).send({
        error: `Ya tienes un pago pendiente de aprobación. Podrás volver a intentarlo en ${remainingMin} min.`,
      });
    }

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
        expiresAt: new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000),
      },
    });

    // Avisa al admin por push de que alguien intentó pagar la membresía.
    const buyerName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username;
    void notifyAdmins('💳 Intento de pago', `${buyerName} inició el pago del plan ${plan.name} (${plan.price} USDT).`);

    // Crear invoice en NowPayments para que el usuario pague con cripto.
    // Si la moneda configurada es USDT (bep20/polygon), el monto es EXACTO en USDT
    // (500 USDT / 1000 USDT) y no depende del tipo de cambio.
    let invoiceUrl: string | null = null;
    // Pagos manuales (tarjeta Whop / transferencia bancaria): se registran como PENDING
    // sin invoice de NowPayments. El admin los aprueba manualmente desde el panel.
    if (!isManualMethod && config.nowpayments.apiKey) {
      try {
        const payCurrency = settings.paymentCurrency === 'usd' ? undefined : settings.paymentCurrency;
        const invoice = await createInvoice({
          priceAmount: payment.amount,
          priceCurrency: payCurrency || 'usd',
          orderId: `c1-${payment.id}`,
          orderDescription: `Membresía Círculo 1 - ${user.firstName} ${user.lastName || ''}`.trim(),
          successUrl: `${config.frontendUrl}/program`,
          cancelUrl: `${config.frontendUrl}/program`,
          ipnCallbackUrl: `${config.backendUrl}/api/membership/payments/webhook`,
          payCurrency,
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

    const activePending = await getActivePendingPayment(userId);
    if (activePending) {
      const remainingMin = Math.ceil((activePending.expiresAt.getTime() - Date.now()) / 60000);
      return reply.code(400).send({
        error: `Ya tienes un pago pendiente de aprobación. Podrás volver a intentarlo en ${remainingMin} min.`,
      });
    }

    const payment = await prisma.membershipPayment.create({
      data: {
        userId,
        amount: settings.monthlyFee,
        type: 'MONTHLY',
        status: 'PENDING',
        method: body.method,
        reference: body.reference,
        expiresAt: new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000),
      },
    });

    // Avisa al admin por push del intento de pago de la cuota mensual.
    const buyerName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username;
    void notifyAdmins('💳 Intento de pago (cuota)', `${buyerName} inició el pago de la cuota mensual (${settings.monthlyFee} USDT).`);

    let invoiceUrl: string | null = null;
    if (config.nowpayments.apiKey) {
      try {
        const payCurrency = settings.paymentCurrency === 'usd' ? undefined : settings.paymentCurrency;
        const invoice = await createInvoice({
          priceAmount: payment.amount,
          priceCurrency: payCurrency || 'usd',
          orderId: `c1-${payment.id}`,
          orderDescription: `Cuota mensual Círculo 1 - ${user.firstName} ${user.lastName || ''}`.trim(),
          successUrl: `${config.frontendUrl}/program`,
          cancelUrl: `${config.frontendUrl}/program`,
          ipnCallbackUrl: `${config.backendUrl}/api/membership/payments/webhook`,
          payCurrency,
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
      if (payment.type === 'CREATOR_EXTRA') {
        await activateCreatorExtra(paymentId, 'nowpayments');
      } else {
        await activateMembership(paymentId, 'nowpayments');
      }
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
  app.get('/payments/pending', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;

    const pending = await prisma.membershipPayment.findFirst({
      where: { userId, status: 'PENDING', type: { in: ['MEMBERSHIP', 'MONTHLY'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) return { payment: null };

    const expiresAt = pending.expiresAt ?? new Date(pending.createdAt.getTime() + PAYMENT_TTL_MINUTES * 60 * 1000);
    const remainingMs = expiresAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      await prisma.membershipPayment.update({
        where: { id: pending.id },
        data: { status: 'REJECTED', npStatus: pending.npStatus ?? 'expired', reference: pending.reference ?? 'expirado' },
      });
      return { payment: null };
    }

    return {
      payment: {
        id: pending.id,
        status: pending.status,
        npStatus: pending.npStatus,
        invoiceUrl: pending.npInvoiceUrl,
        amount: pending.amount,
        type: pending.type,
        expiresAt: expiresAt.toISOString(),
        remainingMin: Math.ceil(remainingMs / 60000),
      },
    };
  });

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
    const dailyAgg = await prisma.dailyEarning.aggregate({ where: { userId }, _sum: { amount: true } });
    const dailyTotal = dailyAgg._sum.amount ?? 0;

    return {
      balance: user?.balance ?? 0,
      totalEarned: (totalEarned._sum.amount ?? 0) + dailyTotal,
      dailyTotal,
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

  app.get('/daily-earnings/summary', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const agg = await prisma.dailyEarning.aggregate({ where: { userId }, _sum: { amount: true }, _count: true });
    const last7 = await prisma.dailyEarning.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 });
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = await prisma.dailyEarning.findFirst({ where: { userId, date: new Date(todayStr) } });
    // Apps y boost del plan del usuario
    let apps: any[] = [];
    let bonusPerReferral = 0.02;
    let bonusCap = 0.1;
    try {
      const lastPaid = await prisma.membershipPayment.findFirst({ where: { userId, type: 'MEMBERSHIP', status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
      if (lastPaid?.planId) {
        const row = await prisma.adminSetting.findUnique({ where: { key: 'PLANS' } });
        if (row) {
          const plans = JSON.parse(row.value as any);
          const plan = Array.isArray(plans) ? plans.find((p: any) => p.id === lastPaid.planId) : null;
          if (plan?.dailyYield?.apps) apps = plan.dailyYield.apps;
          if (plan?.dailyYield?.bonusPerReferral != null) bonusPerReferral = Number(plan.dailyYield.bonusPerReferral);
          if (plan?.dailyYield?.bonusCap != null) bonusCap = Number(plan.dailyYield.bonusCap);
        }
      }
    } catch {}
    const directActive = await prisma.user.count({ where: { referrerId: userId, membershipStatus: 'ACTIVE' } });
    const referrals = await prisma.user.findMany({ where: { referrerId: userId, membershipStatus: 'ACTIVE' }, select: { firstName: true, lastName: true, username: true, avatarUrl: true }, take: 5 });
    return {
      total: agg._sum.amount ?? 0,
      count: agg._count,
      today: today?.amount ?? 0,
      todayPercent: today?.percent ?? 0,
      last7: last7.reverse(),
      apps,
      directActive,
      referrals,
      bonusPerReferral,
      bonusCap,
    };
  });

  app.get('/daily-earnings/history', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const take = 30;
    const [rows, total] = await Promise.all([
      prisma.dailyEarning.findMany({ where: { userId }, orderBy: { date: 'desc' }, skip: (page - 1) * take, take }),
      prisma.dailyEarning.count({ where: { userId } }),
    ]);
    return { rows, total, page, totalPages: Math.ceil(total / take) };
  });
}