import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { resolvePackForUser, approveTikTokCommission, creditPackReferral } from '../utils/tiktok.js';
import { sendWebPush } from '../utils/onesignal.js';

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

async function getAutoApprove(): Promise<boolean> {
  const row = await prisma.adminSetting.findUnique({ where: { key: 'TIKTOK_AUTO_APPROVE' } });
  if (row) {
    try { return JSON.parse(row.value as any) !== false; } catch { /* ignore */ }
  }
  return false;
}

export async function adminTiktokRoutes(app: FastifyInstance) {
  // ─── Listado de usuarios con paginación (30 por página) y búsqueda ───
  app.get('/users', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const query = request.query as { search?: string; page?: string };
    const search = query.search?.trim() || '';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const take = 30;

    const where = search
      ? { OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        select: {
          id: true, email: true, username: true, firstName: true, lastName: true, country: true,
          membershipStatus: true, membershipExpiresAt: true,
          tiktokCampaign: { select: { id: true, packType: true, baseCreators: true, extraCreators: true, isActive: true, _count: { select: { creators: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / take), perPage: take };
  });

  // ─── Detalle de campaña de un usuario (o crear si no existe) ───
  app.get('/campaigns/:userId', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    let campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    const maxCreators = campaign ? campaign.baseCreators + campaign.extraCreators : 0;

    const products = await prisma.tikTokProduct.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

    const creators = campaign
      ? await prisma.tikTokCreator.findMany({ where: { campaignId: campaign.id }, orderBy: { createdAt: 'asc' } })
      : [];

    const sales = campaign
      ? await prisma.tikTokSale.findMany({
          where: { campaignId: campaign.id },
          orderBy: { saleDate: 'desc' },
          include: { product: true, creator: true, commissions: { include: { user: { select: { firstName: true, lastName: true, username: true } } } } },
        })
      : [];

    const pendingCommissions = campaign
      ? await prisma.tikTokCommission.findMany({
          where: { sale: { campaignId: campaign.id }, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          include: {
            sale: { include: { product: true, creator: true, campaign: { include: { user: { select: { firstName: true, lastName: true, username: true } } } } } },
            user: { select: { firstName: true, lastName: true, username: true, membershipStatus: true, membershipExpiresAt: true } },
          },
        })
      : [];

    return { user, campaign, maxCreators, creators, sales, pendingCommissions, products };
  });

  // ─── Activar campaña (manual por admin) ───
  app.post('/campaigns/:userId/activate', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const existing = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    if (existing) return reply.code(400).send({ error: 'Ya existe una campaña' });

    const { packType, baseCreators } = await resolvePackForUser(userId);
    const campaign = await prisma.tikTokShopCampaign.create({ data: { userId, packType, baseCreators } });

    // Si el usuario no pagó membresía real, el admin al activar el pack genera
    // las comisiones de referido (25% L1 / 5% L2) para su red.
    const adminUser = (request as any).user as JWTPayload;
    const referral = await creditPackReferral(userId, packType, adminUser.sub).catch((err: any) => {
      request.log.warn({ err }, 'No se pudo generar comisión de referido por pack');
      return { level1: 0, level2: 0 };
    });

    return { campaign, referral };
  });

  // ─── Ajustar pack del usuario manualmente (admin) ───
  const updatePackSchema = z.object({
    packType: z.number().int().positive().optional(),
    baseCreators: z.number().int().min(0).max(100).optional(),
    extraCreators: z.number().int().min(0).max(100).optional(),
  });

  app.put('/campaigns/:userId/pack', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = updatePackSchema.parse(request.body);

    let campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    const wasNewCampaign = !campaign;
    if (!campaign) {
      const { packType, baseCreators } = await resolvePackForUser(userId);
      campaign = await prisma.tikTokShopCampaign.create({ data: { userId, packType, baseCreators } });
    }

    // Al elegir packType 500/1000 se sincroniza baseCreators con la regla por defecto,
    // salvo que el admin indique un baseCreators explícito (caso excepción).
    let base = body.baseCreators;
    if (base === undefined && body.packType !== undefined) {
      base = body.packType >= 1000 ? 10 : 5;
    }

    const packChanged = body.packType !== undefined && body.packType !== campaign.packType;

    const updated = await prisma.tikTokShopCampaign.update({
      where: { id: campaign.id },
      data: {
        ...(body.packType !== undefined ? { packType: body.packType } : {}),
        ...(base !== undefined ? { baseCreators: base } : {}),
        ...(body.extraCreators !== undefined ? { extraCreators: body.extraCreators } : {}),
      },
    });

    // Genera comisión de referido cuando el admin asigna el pack por primera vez
    // o lo sube de nivel (500->1000) a un usuario sin membresía real pagada.
    // creditPackReferral ya evita duplicar si existe un pago MEMBERSHIP aprobado.
    let referral: any = { level1: 0, level2: 0 };
    if ((wasNewCampaign || packChanged) && body.packType !== undefined) {
      const adminUser = (request as any).user as JWTPayload;
      referral = await creditPackReferral(userId, body.packType, adminUser.sub).catch((err: any) => {
        request.log.warn({ err }, 'No se pudo generar comisión de referido por pack');
        return { level1: 0, level2: 0 };
      });
    }

    // Si se redujo el límite y hay más creadores asignados, se avisa al admin en la respuesta.
    const assigned = await prisma.tikTokCreator.count({ where: { campaignId: campaign.id } });
    const max = updated.baseCreators + updated.extraCreators;

    return { campaign: updated, assigned, maxCreators: max, overLimit: assigned > max, referral };
  });

  // ─── Asignar creador a la campaña ───
  const createCreatorSchema = z.object({
    name: z.string().min(1, 'El nombre del creador es obligatorio').max(255),
    tiktokUrl: z.string().max(500).optional().nullable(),
    status: z.enum(['PENDIENTE', 'ACEPTADO', 'ACTIVO']).default('PENDIENTE'),
  });

  app.post('/campaigns/:userId/creators', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = createCreatorSchema.parse(request.body);

    let campaign = await prisma.tikTokShopCampaign.findUnique({ where: { userId } });
    if (!campaign) {
      const { packType, baseCreators } = await resolvePackForUser(userId);
      campaign = await prisma.tikTokShopCampaign.create({ data: { userId, packType, baseCreators } });
    }

    const creator = await prisma.tikTokCreator.create({
      data: { campaignId: campaign.id, name: body.name.trim(), tiktokUrl: body.tiktokUrl?.trim() || null, status: body.status },
    });

    // Avisa al alumno por push de que le asignaron un creador.
    try {
      const alumno = await prisma.user.findUnique({ where: { id: userId }, select: { pushEnabled: true, pushCommissions: true } });
      if (alumno?.pushEnabled && alumno.pushCommissions) {
        await sendWebPush({
          externalUserIds: [userId],
          title: 'Nuevo creador asignado 🎬',
          message: `Te asignaron al creador de contenido ${body.name}. Revisa tu panel de TikTok Shop.`,
          url: '/tiktok-shop',
        });
      }
      await prisma.notification.create({
        data: { userId, title: 'Nuevo creador asignado', message: `Te asignaron al creador de contenido ${body.name}.` },
      });
    } catch { /* no romper */ }

    return { creator };
  });

  // ─── Editar creador (nombre, link, estatus) ───
  const updateCreatorSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    tiktokUrl: z.string().max(500).optional().nullable(),
    status: z.enum(['PENDIENTE', 'ACEPTADO', 'ACTIVO']).optional(),
  });

  app.put('/creators/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateCreatorSchema.parse(request.body);
    const existing = await prisma.tikTokCreator.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Creador no encontrado' });

    const creator = await prisma.tikTokCreator.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.tiktokUrl !== undefined ? { tiktokUrl: body.tiktokUrl?.trim() || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });
    return { creator };
  });

  // ─── Eliminar creador ───
  app.delete('/creators/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.tikTokCreator.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Creador no encontrado' });
    await prisma.tikTokCreator.delete({ where: { id } });
    return { success: true };
  });

  // ─── Catálogo de productos ───
  const productSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(255),
    price: z.number().positive(),
    commissionRate: z.number().min(0).max(100).default(25),
    sponsorRate: z.number().min(0).max(100).default(5),
  });

  app.get('/products', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const products = await prisma.tikTokProduct.findMany({ orderBy: { name: 'asc' } });
    return { products };
  });

  app.post('/products', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const body = productSchema.parse(request.body);
    const product = await prisma.tikTokProduct.create({ data: body });
    return { product };
  });

  app.put('/products/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = productSchema.partial().parse(request.body);
    const existing = await prisma.tikTokProduct.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Producto no encontrado' });
    const product = await prisma.tikTokProduct.update({ where: { id }, data: body });
    return { product };
  });

  app.delete('/products/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const sales = await prisma.tikTokSale.count({ where: { productId: id } });
    if (sales > 0) return reply.code(400).send({ error: 'No se puede eliminar un producto con ventas registradas' });
    await prisma.tikTokProduct.delete({ where: { id } });
    return { success: true };
  });

  // ─── Registrar venta (crea comisiones PENDING alumno 25% + patrocinador 5%) ───
  const saleSchema = z.object({
    creatorId: z.string().uuid(),
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
    saleDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  });

  app.post('/sales', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const body = saleSchema.parse(request.body);

    const creator = await prisma.tikTokCreator.findUnique({ where: { id: body.creatorId }, include: { campaign: true } });
    if (!creator) return reply.code(404).send({ error: 'Creador no encontrado' });
    const product = await prisma.tikTokProduct.findUnique({ where: { id: body.productId } });
    if (!product) return reply.code(404).send({ error: 'Producto no encontrado' });

    const saleDate = body.saleDate ? new Date(body.saleDate) : new Date();
    const total = Math.round(product.price * body.quantity * 100) / 100;
    const studentAmount = Math.round(total * product.commissionRate / 100 * 100) / 100;
    const sponsorAmount = Math.round(total * product.sponsorRate / 100 * 100) / 100;

    const campaign = creator.campaign;
    const user = await prisma.user.findUnique({ where: { id: campaign.userId } });

    const sale = await prisma.tikTokSale.create({
      data: {
        campaignId: campaign.id,
        creatorId: creator.id,
        productId: product.id,
        quantity: body.quantity,
        unitPrice: product.price,
        saleDate,
        notes: body.notes?.trim() || null,
        commissions: {
          create: [
            {
              userId: campaign.userId,
              type: 'STUDENT',
              percent: product.commissionRate,
              amount: studentAmount,
            },
            ...(user?.referrerId
              ? [{
                  userId: user.referrerId,
                  type: 'SPONSOR' as const,
                  percent: product.sponsorRate,
                  amount: sponsorAmount,
                }]
              : []),
          ],
        },
      },
      include: { product: true, creator: true, commissions: true },
    });

    // Push al alumno: se registró una venta por su creador.
    // Si la aprobación automática está activa, las comisiones ya se acreditaron.
    const autoApprove = await getAutoApprove();
    let autoApproved = 0;
    if (autoApprove) {
      for (const c of sale.commissions) {
        try {
          await approveTikTokCommission(c.id, (request as any).user?.sub || 'auto');
          autoApproved++;
        } catch (err: any) {
          request.log.warn({ err }, 'No se pudo aprobar comisión automáticamente');
        }
      }
    }

    try {
      const alumno = await prisma.user.findUnique({ where: { id: campaign.userId }, select: { pushEnabled: true, pushCommissions: true } });
      if (alumno?.pushEnabled && alumno.pushCommissions) {
        await sendWebPush({
          externalUserIds: [campaign.userId],
          title: '¡Venta registrada! 🎉',
          message: autoApprove
            ? `${creator.name} vendió ${body.quantity} ${product.name} por ${fmtUSD(total)}. Ganaste ${fmtUSD(studentAmount)}.`
            : `${creator.name} vendió ${body.quantity} ${product.name} por ${fmtUSD(total)}. Tu comisión ${fmtUSD(studentAmount)} está pendiente.`,
          url: '/tiktok-shop',
        });
      }
      await prisma.notification.create({
        data: {
          userId: campaign.userId,
          title: '¡Venta registrada!',
          message: autoApprove
            ? `${creator.name} vendió ${body.quantity} ${product.name} por ${fmtUSD(total)}. Ganaste ${fmtUSD(studentAmount)}.`
            : `${creator.name} vendió ${body.quantity} ${product.name} por ${fmtUSD(total)}. Ganaste ${fmtUSD(studentAmount)} (pendiente).`,
        },
      });
    } catch { /* no romper */ }

    const refreshedSale = await prisma.tikTokSale.findUnique({
      where: { id: sale.id },
      include: { product: true, creator: true, commissions: true },
    });

    return { sale: refreshedSale, autoApproved };
  });

  // ─── Eliminar venta (revierte comisiones aprobadas) ───
  app.delete('/sales/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await prisma.tikTokSale.findUnique({ where: { id }, include: { commissions: true } });
    if (!sale) return reply.code(404).send({ error: 'Venta no encontrada' });

    await prisma.$transaction(async (tx) => {
      for (const c of sale.commissions) {
        if (c.status === 'APPROVED') {
          await tx.user.update({ where: { id: c.userId }, data: { balance: { decrement: c.amount } } });
        }
      }
      await tx.tikTokSale.delete({ where: { id } });
    });

    return { success: true };
  });

  // ─── Comisiones pendientes (para aprobar) ───
  app.get('/commissions/pending', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const commissions = await prisma.tikTokCommission.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        sale: {
          include: {
            product: true,
            creator: true,
            campaign: { include: { user: { select: { firstName: true, lastName: true, username: true } } } },
          },
        },
        user: { select: { firstName: true, lastName: true, username: true, membershipStatus: true, membershipExpiresAt: true } },
      },
    });
    const total = commissions.reduce((s, c) => s + c.amount, 0);
    return { total, commissions };
  });

  app.post('/commissions/:id/approve', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminUser = (request as any).user as JWTPayload;
    try {
      await approveTikTokCommission(id, adminUser.sub);
    } catch (err: any) {
      if (err.message === 'Comisión no encontrada') return reply.code(404).send({ error: err.message });
      if (err.message === 'Esta comisión ya fue procesada') return reply.code(400).send({ error: err.message });
      throw err;
    }
    return { success: true };
  });

  app.post('/commissions/:id/reject', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.tikTokCommission.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Comisión no encontrada' });
    if (existing.status !== 'PENDING') return reply.code(400).send({ error: 'Esta comisión ya fue procesada' });
    await prisma.tikTokCommission.update({ where: { id }, data: { status: 'REJECTED' } });
    return { success: true };
  });

  // ─── Historial global de comisiones TikTok ───
  app.get('/commissions', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const commissions = await prisma.tikTokCommission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sale: { include: { product: true, creator: true, campaign: { include: { user: { select: { firstName: true, lastName: true, username: true } } } } } },
        user: { select: { firstName: true, lastName: true, username: true } },
      },
    });
    return { commissions };
  });
}
