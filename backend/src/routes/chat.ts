import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { sendWebPush } from '../utils/onesignal.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
}

const PAGE_SIZE = 50;
const MAX_CHARS = 300;
const MAX_PER_MINUTE = 15;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Palabras prohibidas (insultos / spam) — se censuran con * en el mensaje.
const BAD_WORDS = [
  'puta', 'puto', 'pendejo', 'pinche', 'chinga', 'chingar', 'marica', 'maricon',
  'verga', 'vergas', 'mierda', 'mierdas', 'coño', 'conio', 'carajo', 'joder',
  'cabron', 'cabron', 'idiota', 'imbecil', 'estupido', 'estupida', 'tonto',
  'estupido', 'tarado', 'retrasado', 'subnormal', 'hijueputa', 'hp ', 'maldito',
  'hdp', 'gtfo', 'wtf', 'ctm', 'tmm', 'culo', 'culero', 'ass', 'bitch', 'fuck',
  'shit', 'damn', 'idiot', 'stupid', 'moron', 'bastard',
];

// Reemplaza palabras prohibidas por asteriscos.
function censorText(text: string): { text: string; censored: boolean } {
  let censored = false;
  let result = text;
  for (const w of BAD_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, 'gi');
    if (re.test(result)) {
      censored = true;
      result = result.replace(re, '*'.repeat(w.length));
    }
  }
  return { text: result, censored };
}

const userSelect = { id: true, firstName: true, lastName: true, username: true, country: true, avatarUrl: true, role: true };

function formatMessage(m: any, userId: string, viewerIsAdmin: boolean) {
  const shown = m.asUser || m.sender;
  const isImpersonated = !!m.asUserId && m.userId !== m.asUserId;
  return {
    id: m.id,
    message: m.message,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt,
    deletedAt: m.deletedAt,
    // Para el admin: el mensaje eliminado se muestra pero ocultando el contenido original
    isDeleted: !!m.deletedAt,
    messagePreview: m.deletedAt ? '🗑️ Mensaje eliminado por el administrador' : m.message,
    user: {
      id: shown?.id,
      firstName: shown?.firstName,
      lastName: shown?.lastName,
      username: shown?.username,
      country: shown?.country,
      avatarUrl: shown?.avatarUrl,
      role: shown?.role,
    },
    isImpersonated,
    isOwn: m.userId === userId,
  };
}

export async function chatRoutes(app: FastifyInstance) {
  // ─── Listar mensajes del chat comunitario (paginado por cursor) ───
  // before = createdAt (ISO) del primer mensaje cargado → trae los anteriores.
  app.get('/messages', { preHandler: authMiddleware }, async (request) => {
    const userId = (request.user as any).sub as string;
    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const viewerIsAdmin = viewer?.role === 'ADMIN';
    const { before } = request.query as { before?: string };

    const where: any = {};
    if (before) where.createdAt = { lt: new Date(before) };
    if (!viewerIsAdmin) where.deletedAt = null;

    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      where,
      include: { asUser: { select: userSelect }, sender: { select: userSelect } },
    });

    const hasMore = messages.length === PAGE_SIZE;
    return {
      messages: messages.map(m => formatMessage(m, userId, viewerIsAdmin)).reverse(),
      hasMore,
    };
  });

  // ─── Enviar mensaje al chat ───
  const sendSchema = z.object({
    message: z
      .string()
      .max(MAX_CHARS, `Mensaje demasiado largo (máximo ${MAX_CHARS} caracteres)`)
      .optional()
      .or(z.literal('')),
    imageUrl: z.string().max(500).optional(),
    asUserId: z.string().optional(),
  });

  app.post('/messages', { preHandler: authMiddleware }, async (request, reply) => {
    const body = sendSchema.parse(request.body);
    const authUser = (request.user as any) as JWTPayload & { role: string };
    const senderId = authUser.sub;

    const message = (body.message || '').trim();

    // Debe haber mensaje o imagen (o ambos).
    if (!message && !body.imageUrl) {
      return reply.code(400).send({ error: 'Escribe un mensaje o adjunta una imagen' });
    }

    // Censura de palabras prohibidas.
    let finalMessage = message;
    let censored = false;
    if (message) {
      const cens = censorText(message);
      finalMessage = cens.text;
      censored = cens.censored;
    }

    // Usuario bloqueado no puede chatear.
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { chatBlocked: true, role: true },
    });
    if (sender?.chatBlocked) {
      return reply.code(403).send({ error: 'Has sido bloqueado del chat por el administrador.' });
    }

    // Anti-spam: limita la cantidad de mensajes por ventana de tiempo.
    const windowStart = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.chatMessage.count({
      where: { userId: senderId, createdAt: { gte: windowStart } },
    });
    if (recentCount >= MAX_PER_MINUTE) {
      return reply.code(429).send({ error: 'Estás enviando demasiados mensajes. Espera un momento.' });
    }

    let asUserId: string | null = null;
    if (body.asUserId) {
      // Solo el admin puede impersonar a otro usuario.
      if (authUser.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo el administrador puede enviar como otro usuario' });
      }
      const target = await prisma.user.findUnique({
        where: { id: body.asUserId },
        select: { id: true, role: true },
      });
      if (!target) return reply.code(404).send({ error: 'El usuario a impersonar no existe' });
      // No permitir impersonar a otro admin.
      if (target.role === 'ADMIN') return reply.code(400).send({ error: 'No puedes impersonar a otro administrador' });
      asUserId = target.id;
    }

    const created = await prisma.chatMessage.create({
      data: { userId: senderId, asUserId, message: finalMessage, imageUrl: body.imageUrl || null },
      include: { asUser: { select: userSelect }, sender: { select: userSelect } },
    });

    // Notificaciones por menciones y a suscritos a todos los mensajes.
    if (finalMessage) {
      try {
        const shownName = created.asUser?.firstName || created.sender?.firstName || created.sender?.username || 'Alguien';

        // 1. Usuarios suscritos a todos los mensajes del chat
        const allMsgUsers = await prisma.user.findMany({
          where: { pushEnabled: true, pushChatAll: true, id: { not: senderId } },
          select: { id: true },
        });
        const allMsgUserIds = allMsgUsers.map(u => u.id);

        // 2. Usuarios mencionados con @
        const mentions = [...finalMessage.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1].toLowerCase());
        let mentionedUserIds: string[] = [];

        if (mentions.length > 0) {
          const mentioned = await prisma.user.findMany({
            where: { username: { in: mentions }, id: { not: senderId } },
            select: { id: true, pushEnabled: true, pushChat: true },
          });

          if (mentioned.length > 0) {
            await prisma.notification.createMany({
              data: mentioned.map(u => ({
                userId: u.id,
                type: 'mention',
                title: 'Te mencionaron en el chat',
                message: `${shownName} te mencionó: "${finalMessage.slice(0, 120)}"`,
              })),
            });

            mentionedUserIds = mentioned.filter(u => u.pushEnabled && u.pushChat).map(u => u.id);
          }
        }

        // Enviar push a los mencionados
        if (mentionedUserIds.length > 0) {
          await sendWebPush({
            externalUserIds: mentionedUserIds,
            title: `${shownName} te mencionó en el chat`,
            message: `"${finalMessage.slice(0, 120)}"`,
          });
        }

        // Enviar push a los que quieren todos los mensajes (excluyendo a los ya notificados por mención)
        const allMsgOnlyIds = allMsgUserIds.filter(id => !mentionedUserIds.includes(id));
        if (allMsgOnlyIds.length > 0) {
          await sendWebPush({
            externalUserIds: allMsgOnlyIds,
            title: `Nuevo mensaje de ${shownName}`,
            message: `"${finalMessage.slice(0, 120)}"`,
          });
        }
      } catch (e) {
        // No romper el envío si falla la notificación
      }
    }

    return { message: formatMessage(created, senderId, false), censored };
  });

  // ─── Subir imagen para un mensaje del chat ───
  // El frontend envía la imagen YA optimizada. Máximo 5MB.
  app.post('/upload', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;

    let data: any;
    try {
      data = await request.file();
    } catch {
      return reply.code(400).send({ error: 'Archivo no válido' });
    }
    if (!data) return reply.code(400).send({ error: 'Debes enviar una imagen' });

    if (data.file.truncated || data.file.bytesRead > MAX_IMAGE_SIZE) {
      return reply.code(400).send({ error: 'La imagen no puede superar los 5MB' });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'Formato no permitido. Usa JPG, PNG o WEBP' });
    }

    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const filename = `chat-${userId}-${randomUUID()}.${extMap[data.mimetype]}`;

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const buffer = await data.toBuffer();
    if (buffer.length > MAX_IMAGE_SIZE) {
      return reply.code(400).send({ error: 'La imagen no puede superar los 5MB' });
    }
    await writeFile(path.join(uploadsDir, filename), buffer);

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    return { imageUrl: `${baseUrl}/uploads/${filename}` };
  });

  // ─── Eliminar (ocultar) un mensaje para la comunidad (solo admin) ───
  // El mensaje no se borra de la BD: se marca deletedAt. El admin lo sigue viendo
  // tachado/oculto, los usuarios normales ya no lo ven.
  app.delete('/messages/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const msg = await prisma.chatMessage.findUnique({ where: { id } });
    if (!msg) return reply.code(404).send({ error: 'Mensaje no encontrado' });
    await prisma.chatMessage.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  });

  // ─── Restaurar un mensaje eliminado (solo admin) ───
  app.post('/messages/:id/restore', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const msg = await prisma.chatMessage.findUnique({ where: { id } });
    if (!msg) return reply.code(404).send({ error: 'Mensaje no encontrado' });
    await prisma.chatMessage.update({ where: { id }, data: { deletedAt: null } });
    return { success: true };
  });

  // ─── Usuarios disponibles para impersonar / bloquear (solo admin) ───
  app.get('/users', { preHandler: authMiddleware }, async (request, reply) => {
    const authUser = (request.user as any) as JWTPayload & { role: string };
    if (authUser.role !== 'ADMIN') return reply.code(403).send({ error: 'Acceso denegado' });

    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, firstName: true, lastName: true, username: true, country: true, avatarUrl: true, chatBlocked: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { users };
  });

  // ─── Bloquear / desbloquear a un usuario del chat (solo admin) ───
  const blockSchema = z.object({ blocked: z.boolean() });

  app.put('/users/:id/block', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { blocked } = blockSchema.parse(request.body);

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) return reply.code(404).send({ error: 'Usuario no encontrado' });
    if (target.role === 'ADMIN') return reply.code(400).send({ error: 'No puedes bloquear a otro administrador' });

    await prisma.user.update({ where: { id }, data: { chatBlocked: blocked } });
    return { success: true, blocked };
  });

  // ─── Auditoría: mensajes con impersonación, mostrando quién escribió de verdad (solo admin) ───
  app.get('/audit', { preHandler: [authMiddleware, adminMiddleware] }, async () => {
    const messages = await prisma.chatMessage.findMany({
      where: { asUserId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, username: true, role: true } },
        asUser: { select: { id: true, firstName: true, lastName: true, username: true, role: true } },
      },
    });
    return {
      messages: messages.map(m => ({
        id: m.id,
        message: m.message,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        realSender: { id: m.sender?.id, name: m.sender?.firstName || m.sender?.username, username: m.sender?.username },
        shownAs: { id: m.asUser?.id, name: m.asUser?.firstName || m.asUser?.username, username: m.asUser?.username },
      })),
    };
  });
}
