import { FastifyInstance } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { config } from '../config/index.js';
import { createInvoice, getPaymentStatus } from '../utils/nowpayments.js';
import { resolvePackForUser, activateCreatorExtra, campaignMaxCreators } from '../utils/tiktok.js';
import { effectiveMembership } from '../utils/membershipStatus.js';
import { sendWebPush } from '../utils/onesignal.js';

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseUrlOf = (request: any) => {
  const proto = (request.headers['x-forwarded-proto'] as string) || request.protocol || 'https';
  const host = (request.headers['x-forwarded-host'] as string) || request.headers.host;
  return process.env.BACKEND_URL || (host ? `${proto}://${host}` : '');
};

// Borra del disco un archivo servido desde /uploads/ (para no dejar huérfanos).
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
async function removeUploadedFile(url: string | null | undefined) {
  if (!url || typeof url !== 'string') return;
  const idx = url.indexOf('/uploads/');
  if (idx === -1) return;
  const full = path.normalize(path.join(uploadsRoot, url.slice(idx + '/uploads/'.length)));
  if (!full.startsWith(uploadsRoot)) return;
  try { await unlink(full); } catch { /* ya no existe */ }
}

const PAYMENT_TTL_MINUTES = 30;
const CUSTOM_VIDEO_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

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
            productSlots: campaign.productSlots ?? [],
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

  // ─── Material de productos para el usuario (imágenes y videos para usar/descargar) ───
  app.get('/material', { preHandler: authMiddleware }, async () => {
    const [categories, products] = await Promise.all([
      prisma.productCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      prisma.tikTokProduct.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          category: true,
          media: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
        },
      }),
    ]);

    const withMedia = products.filter(p => p.media.length > 0);
    const grouped = new Map<string, any[]>();
    for (const p of withMedia) {
      const key = p.categoryId || '__none__';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        media: p.media.map(m => ({ id: m.id, type: m.type, url: m.url, title: m.title })),
      });
    }

    const result = categories
      .filter(c => grouped.has(c.id))
      .map(c => ({ id: c.id, name: c.name, products: grouped.get(c.id)! }));
    if (grouped.has('__none__')) {
      result.push({ id: '__none__', name: 'Otros', products: grouped.get('__none__')! });
    }

    return { categories: result };
  });

  // ─── Videos personalizados ───
  const createCustomVideoSchema = z.object({
    photos: z.array(z.string().max(600)).min(1).max(3),
    productIds: z.array(z.string()).length(2),
  });

  // Subir una foto (máx 8MB) para la solicitud de video personalizado.
  app.post('/custom-video/upload-photo', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    let data: any;
    try { data = await (request as any).file({ limits: { fileSize: 8 * 1024 * 1024 } }); } catch { return reply.code(400).send({ error: 'Archivo no válido o demasiado grande (máx 8MB)' }); }
    if (!data) return reply.code(400).send({ error: 'Debes enviar una imagen' });
    const allowed: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = allowed[data.mimetype];
    if (!ext) return reply.code(400).send({ error: 'Formato no permitido. Usa JPG, PNG o WEBP' });
    const filename = `photo-${randomUUID()}.${ext}`;
    const dir = path.join(__dirname, '..', '..', 'uploads', 'custom-videos', userId);
    await mkdir(dir, { recursive: true });
    const buffer = await data.toBuffer();
    if (data.file?.truncated) return reply.code(400).send({ error: 'La imagen supera los 8MB' });
    await writeFile(path.join(dir, filename), buffer);
    const base = baseUrlOf(request);
    return { url: `${base}/uploads/custom-videos/${userId}/${filename}` };
  });

  // Estado de sus solicitudes + productos activos para el selector.
  app.get('/custom-video', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, membershipStatus: true, membershipExpiresAt: true, role: true } });
    const eff = effectiveMembership(user!);
    const isActive = eff.status === 'ACTIVE';

    const requests = await prisma.customVideoRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
    });

    const activeReq = requests.find(r => r.status !== 'CANCELADO');
    let canRequest = isActive;
    let nextAvailableAt: string | null = null;
    if (activeReq) {
      const next = new Date(activeReq.createdAt.getTime() + CUSTOM_VIDEO_WINDOW_MS);
      if (next > new Date()) { canRequest = false; nextAvailableAt = next.toISOString(); }
    }

    const products = await prisma.tikTokProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, imageUrl: true },
    });

    return { isActive, canRequest, nextAvailableAt, requests, products };
  });

  app.post('/custom-video', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, membershipStatus: true, membershipExpiresAt: true, role: true } });
    if (effectiveMembership(user!).status !== 'ACTIVE') {
      return reply.code(403).send({ error: 'Necesitas una membresía activa para pedir tu video personalizado' });
    }

    const { photos, productIds } = createCustomVideoSchema.parse(request.body);

    const last = await prisma.customVideoRequest.findFirst({
      where: { userId, status: { not: 'CANCELADO' } },
      orderBy: { createdAt: 'desc' },
    });
    if (last) {
      const next = new Date(last.createdAt.getTime() + CUSTOM_VIDEO_WINDOW_MS);
      if (next > new Date()) return reply.code(400).send({ error: `Ya tienes una solicitud este mes. Podrás pedir otra el ${next.toLocaleDateString('es-ES')}.` });
    }

    const products = await prisma.tikTokProduct.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true } });
    if (products.length !== 2) return reply.code(400).send({ error: 'Selecciona 2 productos válidos del catálogo' });

    const created = await prisma.customVideoRequest.create({
      data: {
        userId,
        status: 'SOLICITADO',
        photos,
        items: { create: productIds.map((pid, i) => ({ productId: pid, order: i })) },
      },
      include: { items: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
    });
    return { request: created };
  });

  app.put('/custom-video/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const req = await prisma.customVideoRequest.findUnique({ where: { id } });
    if (!req || req.userId !== userId) return reply.code(404).send({ error: 'Solicitud no encontrada' });
    if (req.locked) return reply.code(400).send({ error: 'La solicitud ya fue recibida y no se puede editar' });

    const { photos, productIds } = createCustomVideoSchema.parse(request.body);
    const products = await prisma.tikTokProduct.findMany({ where: { id: { in: productIds }, isActive: true }, select: { id: true } });
    if (products.length !== 2) return reply.code(400).send({ error: 'Selecciona 2 productos válidos del catálogo' });

    const oldPhotos: string[] = Array.isArray(req.photos) ? (req.photos as string[]) : [];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.customVideoRequestItem.deleteMany({ where: { requestId: id } });
      return tx.customVideoRequest.update({
        where: { id },
        data: { photos, items: { create: productIds.map((pid, i) => ({ productId: pid, order: i })) } },
        include: { items: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, imageUrl: true } } } } },
      });
    });

    // Borra del disco las fotos que ya no se usan.
    for (const url of oldPhotos) {
      if (!photos.includes(url)) await removeUploadedFile(url);
    }
    return { request: updated };
  });

  app.delete('/custom-video/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const req = await prisma.customVideoRequest.findUnique({ where: { id } });
    if (!req || req.userId !== userId) return reply.code(404).send({ error: 'Solicitud no encontrada' });
    if (req.locked) return reply.code(400).send({ error: 'La solicitud ya fue recibida y no se puede cancelar' });
    await prisma.customVideoRequest.update({ where: { id }, data: { status: 'CANCELADO' } });
    return { success: true };
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

  // ─── Plan visual de productos (qué productos quiere ofrecer el usuario) ───
  // Solo visual: no afecta ventas, comisiones ni creadores.
  const productPlanSchema = z.object({ productIds: z.array(z.string()).max(100) });

  app.put('/product-plan', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    if (!campaign) return reply.code(400).send({ error: 'Activa primero TikTok Shop' });

    const { productIds } = productPlanSchema.parse(request.body);
    const active = await prisma.tikTokProduct.findMany({ where: { isActive: true }, select: { id: true } });
    const valid = new Set(active.map(p => p.id));
    const clean = productIds.filter(id => valid.has(id));

    const updated = await prisma.tikTokShopCampaign.update({
      where: { id: campaign.id },
      data: { productSlots: clean },
    });
    return { productSlots: updated.productSlots ?? [] };
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
