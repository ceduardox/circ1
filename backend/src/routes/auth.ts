import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword, generateReferralCode } from '../utils/auth.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/schemas.js';
import { authMiddleware } from '../middleware/auth.js';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) return reply.code(409).send({ error: 'Email ya registrado' });
    const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingUsername) return reply.code(409).send({ error: 'Usuario ya existe' });

    const passwordHash = await hashPassword(body.password);

    // Resolve referrer if a referral code was provided
    let referrerId: string | null = null;
    if (body.referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: body.referralCode } });
      if (referrer) referrerId = referrer.id;
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

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: body.identifier }, { username: body.identifier }] },
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

    return { user: { id: user.id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, role: user.role }, accessToken };
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
      select: { id: true, email: true, username: true, firstName: true, lastName: true, age: true, country: true, role: true },
    });

    return { user: updated };
  });
}