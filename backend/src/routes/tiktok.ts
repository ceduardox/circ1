import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createInvoice, getPaymentStatus } from '../utils/nowpayments.js';
import { resolvePackForUser, activateCreatorExtra, campaignMaxCreators } from '../utils/tiktok.js';
import { effectiveMembership } from '../utils/membershipStatus.js';

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

const PAYMENT_TTL_MINUTES = 30;

async function getExtraCreatorPrice(): Promise<number> {
  const row = await prisma.adminSetting.findUnique({ where: { key: 'TIKTOK_EXTRA_CREATOR_PRICE' } });
  if (row) {
    try { return Number(JSON.parse(row.value as any)); } catch { /* ignore */ }
  }
  return 50;
}

// Pago CREATOR_EXTRA pendiente vigente (no expirado) del usuario.
async function getActivePendingExtra(userId: string) {
  const pending = await prisma.membershipPayment.findFirst({
    where: { userId, type: 'CREATOR_EXTRA', status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!pending) return null;
  const expiresAt = pending.expiresAt ?? new Date(pending.createdAt.getTime() + PAYMENT_TTL_MINUTES * 60 * 1000);
  if (expiresAt <= new Date()) {
    await prisma.membershipPayment.update({
      where: { id: pending.id },
      data: { status: 'REJECTED', npStatus: pending.npStatus ?? 'expired', reference: pending.reference ?? 'expirado' },
    });
    return null;
  }
  return { payment: pending, expiresAt };
}

export async function tiktokRoutes(app: FastifyInstance) {
  // ─── Mi panel de TikTok Shop ───
  app.get('/my', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, membershipStatus: true, membershipExpiresAt: true, role: true },
    });
    const eff = effectiveMembership(user!);

    const campaign = await prisma.tikTokShopCampaign.findUnique({
      where: { userId },
      include: { creators: { orderBy: { createdAt: 'asc' } } },
    });

    const products = await prisma.tikTokProduct.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

    let sales: any[] = [];
    let myCommissions: any[] = [];
    let summary = { totalApproved: 0, totalPending: 0, totalSales: 0, totalRevenue: 0 };
    let extraPayments: any[] = [];

    if (campaign) {
      sales = await prisma.tikTokSale.findMany({
        where: { campaignId: campaign.id },
        orderBy: { saleDate: 'desc' },
        include: {
          product: true,
          creator: true,
          commissions: true,
        },
      });

      myCommissions = await prisma.tikTokCommission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { sale: { include: { product: true, creator: true } } },
      });

      const approved = myCommissions.filter(c => c.status === 'APPROVED');
      const pending = myCommissions.filter(c => c.status === 'PENDING');
      summary = {
        totalApproved: approved.reduce((s, c) => s + c.amount, 0),
        totalPending: pending.reduce((s, c) => s + c.amount, 0),
        totalSales: sales.length,
        totalRevenue: sales.reduce((s, x) => s + x.unitPrice * x.quantity, 0),
      };

      extraPayments = await prisma.membershipPayment.findMany({
        where: { campaignId: campaign.id, type: 'CREATOR_EXTRA' },
        orderBy: { createdAt: 'desc' },
      });
    }

    const max = campaign ? await campaignMaxCreators(campaign.id) : 0;
    const extraCreatorPrice = await getExtraCreatorPrice();

    return {
      campaign: campaign
        ? {
            id: campaign.id,
            packType: campaign.packType,
            baseCreators: campaign.baseCreators,
            extraCreators: campaign.extraCreators,
            isActive: campaign.isActive,
            createdAt: campaign.createdAt,
          }
        : null,
      maxCreators: max,
      creators: campaign?.creators ?? [],
      sales,
      commissions: myCommissions,
      summary,
      extraPayments,
      products,
      extraCreatorPrice,
      memberStatus: eff.status,
      graceEndsAt: eff.graceEndsAt,
    };
  });

  // ─── Activar TikTok Shop (crea la campaña si no existe) ───
  app.post('/activate', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const existing = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    if (existing) return reply.code(400).send({ error: 'TikTok Shop ya está activado' });

    const { packType, baseCreators } = await resolvePackForUser(userId);
    const campaign = await prisma.tikTokShopCampaign.create({
      data: { userId, packType, baseCreators, isActive: true },
    });

    return { campaign };
  });

  // ─── Comprar un creador extra ($50 USDT) ───
  app.post('/extra-payment/request', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    if (!campaign) return reply.code(400).send({ error: 'Activa primero TikTok Shop' });

    const activePending = await getActivePendingExtra(userId);
    if (activePending) {
      const remainingMin = Math.ceil((activePending.expiresAt.getTime() - Date.now()) / 60000);
      return reply.code(400).send({
        error: `Ya tienes un pago pendiente. Podrás intentarlo de nuevo en ${remainingMin} min.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const price = await getExtraCreatorPrice();
    const payment = await prisma.membershipPayment.create({
      data: {
        userId,
        amount: price,
        type: 'CREATOR_EXTRA',
        status: 'PENDING',
        campaignId: campaign.id,
        expiresAt: new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000),
      },
    });

    const settingsRow = await prisma.adminSetting.findUnique({ where: { key: 'PAYMENT_CURRENCY' } });
    let paymentCurrency = 'usdtbsc';
    if (settingsRow) {
      try { paymentCurrency = String(JSON.parse(settingsRow.value as any)); } catch { /* ignore */ }
    }

    let invoiceUrl: string | null = null;
    if (config.nowpayments.apiKey) {
      try {
        const payCurrency = paymentCurrency === 'usd' ? undefined : paymentCurrency;
        const invoice = await createInvoice({
          priceAmount: payment.amount,
          priceCurrency: payCurrency || 'usd',
          orderId: `c1-${payment.id}`,
          orderDescription: `Creador de contenido extra - TikTok Shop (${user?.firstName || user?.username || ''})`,
          successUrl: `${config.frontendUrl}/tiktok-shop`,
          cancelUrl: `${config.frontendUrl}/tiktok-shop`,
          ipnCallbackUrl: `${config.backendUrl}/api/membership/payments/webhook`,
          payCurrency,
        });
        invoiceUrl = invoice.invoiceUrl;
        await prisma.membershipPayment.update({
          where: { id: payment.id },
          data: { npPaymentId: String(invoice.paymentId), npInvoiceUrl: invoice.invoiceUrl, npStatus: invoice.paymentStatus },
        });
      } catch (err: any) {
        request.log.warn({ err }, 'No se pudo crear el invoice de NowPayments');
        return reply.code(502).send({ error: 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.' });
      }
    }

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        npStatus: payment.npStatus,
        invoiceUrl,
        amount: payment.amount,
        expiresAt: payment.expiresAt,
      },
      invoiceUrl,
      price,
    };
  });

  // ─── Pago CREATOR_EXTRA pendiente (para polling) ───
  app.get('/extra-payment/pending', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const pending = await getActivePendingExtra(userId);
    if (!pending) return { payment: null };
    return {
      payment: {
        id: pending.payment.id,
        status: pending.payment.status,
        npStatus: pending.payment.npStatus,
        invoiceUrl: pending.payment.npInvoiceUrl,
        amount: pending.payment.amount,
        expiresAt: pending.expiresAt.toISOString(),
        remainingMin: Math.ceil((pending.expiresAt.getTime() - Date.now()) / 60000),
      },
    };
  });

  // ─── Estado de un pago CREATOR_EXTRA (polling del frontend) ───
  app.get('/extra-payment/:id/status', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const payment = await prisma.membershipPayment.findUnique({ where: { id } });
    if (!payment) return reply.code(404).send({ error: 'Pago no encontrado' });
    if (payment.userId !== userId) return reply.code(403).send({ error: 'No autorizado' });

    if (payment.npPaymentId && payment.status === 'PENDING' && config.nowpayments.apiKey) {
      try {
        const status = await getPaymentStatus(Number(payment.npPaymentId));
        await prisma.membershipPayment.update({ where: { id }, data: { npStatus: status.payment_status } });
        if (['confirmed', 'finished'].includes(status.payment_status)) {
          await activateCreatorExtra(id, 'nowpayments-verify');
        }
        const updated = await prisma.membershipPayment.findUnique({ where: { id } });
        return { payment: updated };
      } catch (err: any) {
        request.log.warn({ err }, 'No se pudo consultar estado NowPayments');
        return { payment };
      }
    }

    return { payment };
  });
}
