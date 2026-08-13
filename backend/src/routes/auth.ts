import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword, generateReferralCode } from '../utils/auth.js';
import { registerSchema, loginSchema, updateProfileSchema, pushPrefsSchema } from '../utils/schemas.js';
import { authMiddleware } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) return reply.code(409).send({ error: 'Email ya registrado' });
    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUsername) return reply.code(409).send({ error: 'Usuario ya existe' });

    const passwordHash = await hashPassword(body.password);

    // Setting: ¿está abierto el registro normal (sin código)?
    const setting = await prisma.adminSetting.findUnique({ where: { key: 'REGISTER_OPEN' } });
    let registerOpen = true;
    if (setting) {
      try { registerOpen = JSON.parse(setting.value as any) !== false; } catch { registerOpen = true; }
    }

    // Resolve referrer if a referral code was provided
    let referrer: { id: string; referralPlans: any } | null = null;
    if (body.referralCode) {
      const found = await prisma.user.findUnique({ where: { referralCode: body.referralCode } });
      if (found) referrer = { id: found.id, referralPlans: found.referralPlans as any };
    }

    // Si el registro está cerrado, solo se permite con un código de referido válido.
    if (!registerOpen && !referrer) {
      return reply.code(403).send({ error: 'El registro está cerrado. Necesitas un link de invitación.' });
    }

    let referrerId: string | null = null;
    if (referrer) {
      referrerId = referrer.id;
    } else {
      // Sin código: el nuevo usuario entra debajo del admin (raíz de la red).
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
      if (admin) {
        referrerId = admin.id;
        if (!admin.referralCode) {
          await prisma.user.update({
            where: { id: admin.id },
            data: { referralCode: generateReferralCode(admin.username) },
          });
        }
      }
    }

    // Planes que verá este usuario: los que el referidor eligió, o ambos por defecto.
    // Ej: ["estandar", "elite"] = ambos · ["estandar"] = solo 500 · ["elite"] = solo 1000
    const allPlanIds = ['estandar', 'elite'];
    let referralPlans: string[] = allPlanIds;
    if (referrer?.referralPlans && Array.isArray(referrer.referralPlans)) {
      const valid = (referrer.referralPlans as string[]).filter(p => allPlanIds.includes(p));
      if (valid.length > 0) referralPlans = valid;
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        age: body.age,
        country: body.country,
        referralCode: generateReferralCode(body.username),
        referrerId,
        referralPlans,
      },
      select: { id: true, email: true, username: true, firstName: true, lastName: true, role: true },
    });

    const accessToken = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = app.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '7d' });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });

    return { user, accessToken };
  });

  // Estado público para la página de registro: ¿está abierto el registro normal?
  app.get('/register-status', async () => {
    const setting = await prisma.adminSetting.findUnique({ where: { key: 'REGISTER_OPEN' } });
    let registerOpen = true;
    if (setting) {
      try { registerOpen = JSON.parse(setting.value as any) !== false; } catch { registerOpen = true; }
    }
    return { registerOpen };
  });

  // Qué plan(es) ven tus referidos al registrarse con tu link.
  app.put('/referral-plans', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = (request.body ?? {}) as { plans?: string[] };
    const allPlanIds = ['estandar', 'elite'];
    const plans = Array.isArray(body.plans)
      ? body.plans.filter(p => allPlanIds.includes(p))
      : allPlanIds;
    const safe = plans.length > 0 ? plans : allPlanIds;

    await prisma.user.update({
      where: { id: userId },
      data: { referralPlans: safe },
    });
    return { plans: safe };
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: body.identifier, mode: 'insensitive' } },
          { username: { equals: body.identifier, mode: 'insensitive' } },
        ],
      },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }

    const accessToken = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = app.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '7d' });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });

    return { user: { id: user.id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarUrl: user.avatarUrl, pushEnabled: user.pushEnabled, pushChat: user.pushChat, pushCommissions: user.pushCommissions, pushPayments: user.pushPayments }, accessToken };
  });

  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) return reply.code(401).send({ error: 'Refresh token requerido' });
    try {
      const decoded = app.jwt.verify<JWTPayload>(refreshToken);
      if (decoded.type !== 'refresh') throw new Error();
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new Error();

      const accessToken = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
      const newRefreshToken = app.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '7d' });

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
      });

      return { accessToken };
    } catch {
      return reply.code(401).send({ error: 'Refresh token inválido' });
    }
  });

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/' });
    return { message: 'Sesión cerrada' };
  });

  app.get('/me', { preHandler: authMiddleware }, async (request) => {
    return { user: request.user };
  });

  app.put('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    const userId = (request.user as JWTPayload).sub;

    const data: any = {};
    if (body.firstName) data.firstName = body.firstName;
    if (body.lastName) data.lastName = body.lastName;
    if (body.age !== undefined) data.age = body.age;
    if (body.country) data.country = body.country;

    if (body.newPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !(await verifyPassword(body.currentPassword!, user.passwordHash))) {
        return reply.code(400).send({ error: 'Contraseña actual incorrecta' });
      }
      data.passwordHash = await hashPassword(body.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, username: true, firstName: true, lastName: true, age: true, country: true, role: true, avatarUrl: true },
    });

    return { user: updated };
  });

  // Preferencias de notificaciones push por canal.
  app.put('/push-preferences', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;
    const body = pushPrefsSchema.parse(request.body);
    const data: any = {};
    if (typeof body.pushEnabled === 'boolean') data.pushEnabled = body.pushEnabled;
    if (typeof body.pushChat === 'boolean') data.pushChat = body.pushChat;
    if (typeof body.pushCommissions === 'boolean') data.pushCommissions = body.pushCommissions;
    if (typeof body.pushPayments === 'boolean') data.pushPayments = body.pushPayments;

    await prisma.user.update({ where: { id: userId }, data });
    return { success: true };
  });

  // Subida de foto de perfil (multipart)
  app.post('/avatar', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = (request.user as JWTPayload).sub;

    let data: any;
    try {
      data = await request.file();
    } catch {
      return reply.code(400).send({ error: 'Archivo no válido' });
    }
    if (!data) return reply.code(400).send({ error: 'Debes enviar una imagen' });

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF' });
    }

    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const filename = `${userId}-${randomUUID()}.${extMap[data.mimetype]}`;

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), await data.toBuffer());

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const avatarUrl = `${baseUrl}/uploads/${filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    return { user };
  });
}