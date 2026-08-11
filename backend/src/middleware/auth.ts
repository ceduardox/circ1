import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const payload = request.user as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true, role: true, firstName: true, lastName: true, avatarUrl: true },
    });
    if (!user) {
      return reply.code(401).send({ error: 'Usuario no encontrado' });
    }
    (request as any).user = { ...payload, ...user };
  } catch {
    return reply.code(401).send({ error: 'Token inválido o expirado' });
  }
}

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authMiddleware(request, reply);
  const user = (request as any).user;
  if (!user || user.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Acceso denegado: se requiere rol admin' });
  }
}