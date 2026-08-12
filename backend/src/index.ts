import 'dotenv/config';
import { execSync } from 'child_process';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from './config/index.js';
import { authRoutes } from './routes/auth.js';
import { programRoutes } from './routes/program.js';
import { adminRoutes } from './routes/admin.js';
import { membershipRoutes } from './routes/membership.js';
import { chatRoutes } from './routes/chat.js';
import { ZodError } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


async function runMigrations() {
  if (config.nodeEnv === 'production') {
    try {
      console.log('🔄 Ejecutando migraciones...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Migraciones completadas');
    } catch (e) {
      console.error('❌ Error en migraciones:', e);
      process.exit(1);
    }
  }
}

const app = Fastify({ logger: true });

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError || error.name === 'ZodError') {
    const message = (error as any).errors?.[0]?.message || 'Datos de formulario inválidos';
    return reply.code(400).send({ error: message });
  }
  reply.send(error);
});

await runMigrations();

await app.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
});

await app.register(cookie, {
  secret: config.jwt.secret,
});

await app.register(jwt, {
  secret: config.jwt.secret,
  cookie: { cookieName: 'refreshToken', signed: false },
  sign: { expiresIn: config.jwt.accessExpiry },
});

await app.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
  allowList: ['127.0.0.1', '::1'],
  keyGenerator: (request) => {
    return request.headers['x-forwarded-for'] as string || request.ip || 'unknown';
  },
});

await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

const uploadsDir = path.join(__dirname, '..', 'uploads');
await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(programRoutes, { prefix: '/api/program' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(membershipRoutes, { prefix: '/api/membership' });
await app.register(chatRoutes, { prefix: '/api/chat' });

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`🚀 Backend corriendo en http://localhost:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}