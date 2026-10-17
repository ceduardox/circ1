import { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { z } from 'zod';
import { sendWebPush } from '../utils/onesignal.js';

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

const hashContract = (c: { title: string; body: string }) =>
  createHash('sha256').update(`${c.title}\n${c.body}`).digest('hex');

async function notifyUsers(userIds: string[], title: string, message: string, url: string) {
  for (const userId of userIds) {
    try { await prisma.notification.create({ data: { userId, title, message } }); } catch { /* no romper */ }
    try {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { pushEnabled: true, pushCommissions: true } });
      if (u?.pushEnabled && u.pushCommissions) await sendWebPush({ externalUserIds: [userId], title, message, url });
    } catch { /* no romper */ }
  }
}

// ─── Contratos del usuario ───
export async function contractRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const signatures = await prisma.contractSignature.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { contract: { select: { id: true, title: true, body: true, createdAt: true, repSignatures: true } } },
    });
    const contracts = signatures.map(s => ({
      id: s.id,
      status: s.status,
      signedAt: s.signedAt,
      signedName: s.signedName,
      signatureImage: s.signatureImage,
      contentHash: s.contentHash,
      ip: s.ip,
      createdAt: s.createdAt,
      contract: s.contract,
    }));
    return { contracts };
  });

  const signSchema = z.object({
    signedName: z.string().min(3, 'Escribe tu nombre completo').max(120),
    signatureImage: z.string().min(50, 'Firma requerida').max(500000),
  });

  app.post('/:id/sign', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const sig = await prisma.contractSignature.findUnique({ where: { id }, include: { contract: true } });
    if (!sig || sig.userId !== userId) return reply.code(404).send({ error: 'Contrato no encontrado' });
    if (sig.status === 'FIRMADO') return reply.code(400).send({ error: 'Este contrato ya fue firmado' });

    const { signedName, signatureImage } = signSchema.parse(request.body);
    const ip = request.ip;
    const userAgent = (request.headers['user-agent'] as string) || null;
    const contentHash = hashContract(sig.contract);

    const updated = await prisma.contractSignature.update({
      where: { id },
      data: { status: 'FIRMADO', signedName, signatureImage, ip, userAgent, contentHash, signedAt: new Date() },
    });

    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, username: true } });
      await notifyUsers(admins.map(a => a.id), 'Contrato firmado', `${me?.firstName || me?.username || 'Un usuario'} firmó "${sig.contract.title}".`, '/admin/contracts');
    } catch { /* no romper */ }

    return { signature: updated };
  });
}

// ─── Contratos (admin) ───
const createSchema = z.object({ title: z.string().min(1).max(200), body: z.string().min(1).max(200000) });

export async function adminContractRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        signatures: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, firstName: true, lastName: true, username: true, email: true } } },
        },
      },
    });
    return { contracts };
  });

  app.post('/', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const admin = (request as any).user as JWTPayload;
    const body = createSchema.parse(request.body);
    const contract = await prisma.contract.create({ data: { title: body.title, body: body.body, createdBy: admin.sub } });
    return { contract };
  });

  app.put('/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createSchema.partial().parse(request.body);
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Contrato no encontrado' });
    const signed = await prisma.contractSignature.count({ where: { contractId: id, status: 'FIRMADO' } });
    if (signed > 0) return reply.code(400).send({ error: 'No se puede editar un contrato ya firmado. Crea uno nuevo.' });
    const contract = await prisma.contract.update({ where: { id }, data: body });
    return { contract };
  });

  app.delete('/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'Contrato no encontrado' });
    await prisma.contract.delete({ where: { id } });
    return { success: true };
  });

  app.post('/:id/assign', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userIds } = z.object({ userIds: z.array(z.string()).min(1) }).parse(request.body);
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return reply.code(404).send({ error: 'Contrato no encontrado' });

    const existing = await prisma.contractSignature.findMany({
      where: { contractId: id, userId: { in: userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map(e => e.userId));
    const toAssign = userIds.filter(u => !existingIds.has(u));

    if (toAssign.length > 0) {
      await prisma.contractSignature.createMany({
        data: toAssign.map(userId => ({ contractId: id, userId, status: 'PENDIENTE' as const })),
      });
      await notifyUsers(toAssign, 'Nuevo contrato para firmar', `Tienes un contrato pendiente de firma: "${contract.title}".`, '/contratos');
    }
    return { assigned: toAssign.length, skipped: existingIds.size };
  });

  // Firma de un representante de RYZTOR (Jhonatan / Jose) desde la cuenta admin.
  app.post('/:id/rep-sign', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, signatureImage } = z.object({
      name: z.string().min(3, 'Escribe el nombre').max(120),
      signatureImage: z.string().min(50, 'Firma requerida').max(500000),
    }).parse(request.body);

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return reply.code(404).send({ error: 'Contrato no encontrado' });

    const existing = Array.isArray(contract.repSignatures) ? (contract.repSignatures as any[]) : [];
    if (existing.some((s: any) => (s.name || '').trim().toLowerCase() === name.trim().toLowerCase())) {
      return reply.code(400).send({ error: 'Ese representante ya firmó este contrato' });
    }
    const entry = {
      name: name.trim(),
      signatureImage,
      signedAt: new Date().toISOString(),
      ip: request.ip,
      userAgent: (request.headers['user-agent'] as string) || null,
    };
    const updated = await prisma.contract.update({ where: { id }, data: { repSignatures: [...existing, entry] } });
    return { repSignatures: updated.repSignatures };
  });
}
