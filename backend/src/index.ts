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
import { prisma } from './utils/prisma.js';
import { authRoutes } from './routes/auth.js';
import { programRoutes } from './routes/program.js';
import { adminRoutes } from './routes/admin.js';
import { membershipRoutes } from './routes/membership.js';
import { chatRoutes } from './routes/chat.js';
import { vipProRoutes } from './routes/vipPro.js';
import { teamRoutes } from './routes/team.js';
import { syncDayVideos } from './utils/dayVideos.js';
import { scheduleDailyReminder } from './utils/dailyReminder.js';
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

// Sincroniza los videos de las tareas diarias (idempotente) en cada arranque.
try {
  const synced = await syncDayVideos();
  if (synced > 0) console.log(`🎬 Videos de tareas actualizados: ${synced} días`);
} catch (e) {
  console.error('⚠️ No se pudieron sincronizar los videos de las tareas:', e);
}

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
await app.register(vipProRoutes, { prefix: '/api/vip-pro' });
await app.register(teamRoutes, { prefix: '/api/team' });

// ─── Frontend (SPA) ───
// Si existe la build del frontend, se sirve como estático y cualquier ruta
// no-API cae al index.html (fallback del router).
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist');
await app.register(fastifyStatic, {
  root: frontendDist,
  prefix: '/',
  decorateReply: false,
  wildcard: false,
  setHeaders(res, filePath) {
    const name = path.basename(filePath);
    if (name === 'index.html') {
      // El HTML nunca se cachea: siempre se pide fresco para detectar builds nuevos.
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.includes(`${path.sep}assets${path.sep}`) || /\.(js|css|svg|woff2?)$/i.test(name)) {
      // Assets con hash: inmutables, cache largo.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
});

app.setNotFoundHandler((request, reply) => {
  const url = request.url.split('?')[0];
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
    return reply.code(404).send({ error: 'Ruta no encontrada' });
  }
  return (reply as any).sendFile('index.html', { root: frontendDist });
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`🚀 Backend corriendo en http://localhost:${config.port}`);

  // Recordatorio diario de tarea (8:00 AM).
  scheduleDailyReminder();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}