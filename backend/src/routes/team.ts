import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';

interface JWTPayload { sub: string; email: string; role: string; type?: string; }

const CONTACT_STATUSES = ['PENDING', 'CONTACTED', 'CALL_BACK', 'READY', 'REJECTED'];

export async function teamRoutes(app: FastifyInstance) {
  // ─── Contactos (pipeline de equipo) ───

  app.get('/contacts', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const contacts = await prisma.teamContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { contacts };
  });

  const contactSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    contact: z.string().max(200).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  });

  app.post('/contacts', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = contactSchema.parse(request.body);
    const contact = await prisma.teamContact.create({
      data: {
        userId,
        name: body.name,
        contact: body.contact || null,
        notes: body.notes || null,
      },
    });
    return { contact };
  });

  app.put('/contacts/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const body = z.object({
      name: z.string().min(1).optional(),
      contact: z.string().max(200).optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
      status: z.enum(['PENDING', 'CONTACTED', 'CALL_BACK', 'READY', 'REJECTED']).optional(),
    }).parse(request.body);

    const existing = await prisma.teamContact.findFirst({ where: { id, userId } });
    if (!existing) return reply.code(404).send({ error: 'Contacto no encontrado' });

    const contact = await prisma.teamContact.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.contact !== undefined ? { contact: body.contact } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });
    return { contact };
  });

  app.delete('/contacts/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { id } = request.params as { id: string };
    const existing = await prisma.teamContact.findFirst({ where: { id, userId } });
    if (!existing) return reply.code(404).send({ error: 'Contacto no encontrado' });
    await prisma.teamContact.delete({ where: { id } });
    return { ok: true };
  });

  // ─── Calendario de contenido social ───

  app.get('/social', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as JWTPayload).sub;
    const posts = await prisma.socialPost.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    return { posts };
  });

  const socialSchema = z.object({
    date: z.string(),
    platform: z.string().max(30).optional().nullable(),
    posted: z.boolean().optional(),
    note: z.string().max(200).optional().nullable(),
  });

  app.post('/social', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = socialSchema.parse(request.body);
    const date = new Date(body.date);
    if (isNaN(date.getTime())) return reply.code(400).send({ error: 'Fecha inválida' });

    const post = await prisma.socialPost.upsert({
      where: { userId_date: { userId, date } },
      update: {
        platform: body.platform ?? undefined,
        posted: body.posted ?? undefined,
        note: body.note ?? undefined,
      },
      create: {
        userId,
        date,
        platform: body.platform || null,
        posted: body.posted ?? false,
        note: body.note || null,
      },
    });
    return { post };
  });

  app.delete('/social/:date', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const { date } = request.params as { date: string };
    const d = new Date(date);
    if (isNaN(d.getTime())) return reply.code(400).send({ error: 'Fecha inválida' });
    const existing = await prisma.socialPost.findUnique({
      where: { userId_date: { userId, date: d } },
    });
    if (!existing) return reply.code(404).send({ error: 'Registro no encontrado' });
    await prisma.socialPost.delete({ where: { id: existing.id } });
    return { ok: true };
  });

  void CONTACT_STATUSES;
}
