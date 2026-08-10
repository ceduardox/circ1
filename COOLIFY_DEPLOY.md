# Deploy a Coolify - Guía Rápida

## 1. En Coolify Dashboard

### Crear Proyecto
1. New Project → Docker Compose
2. Repository: tu repo Git (GitHub/GitLab/Bitbucket)
3. Branch: main
4. Build Pack: Docker Compose

### Configurar Variables de Entorno
En la pestaña **Environment Variables** del proyecto:

```env
# Base de datos (Coolify la crea automáticamente)
DATABASE_URL=postgresql://{{POSTGRES_USER}}:{{POSTGRES_PASSWORD}}@postgres:5432/{{POSTGRES_DB}}?schema=public
DB_USER={{POSTGRES_USER}}
DB_PASSWORD={{POSTGRES_PASSWORD}}
DB_NAME={{POSTGRES_DB}}

# JWT - Genera: openssl rand -base64 32
JWT_SECRET=tu_jwt_secret_aqui
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.coolify.app
```

### Agregar Base de Datos PostgreSQL
1. En el proyecto → **Add Resource** → **PostgreSQL**
2. Version: 16
3. Coolify inyecta automáticamente: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

### Dominios
- Frontend: `tu-app.coolify.app` (puerto 80 del contenedor frontend)
- Backend API: `api.tu-app.coolify.app` (puerto 3001 del contenedor backend)
- Configura en **Domains** de cada servicio

## 2. docker-compose.yml (ya listo)
- `postgres`: BD gestionada por Coolify
- `backend`: Puerto 3001, migra BD al iniciar
- `frontend`: Puerto 80 (nginx), proxy `/api` → backend

## 3. Primer Deploy
1. Push a main
2. Coolify detecta cambios → Build → Deploy
3. En logs del backend verás: "Running migrations..."
4. Accede a tu dominio

## 4. Comandos Útiles (SSH en servidor Coolify)
```bash
# Ver logs
coolify logs circulo-backend

# Ejecutar migraciones manual
docker exec circulo-backend npx prisma migrate deploy

# Seed manual
docker exec circulo-backend npx prisma db seed

# Prisma Studio (tunnel)
ssh -L 5555:localhost:5555 user@server
# En backend container: npx prisma studio --port 5555
```

## 5. Healthchecks
- Backend: `GET /health` → 200 OK
- Frontend: Nginx sirve estáticos
- Postgres: `pg_isready`

## 6. Escalado
- Backend: Réplicas + Load Balancer (Coolify gestiona)
- BD: Vertical (más RAM/CPU) o Read Replicas
- Frontend: CDN (Cloudflare) + Múltiples réplicas

---

## Desarrollo Local (sin Docker PostgreSQL)
```bash
# Opción A: Neon/Supabase (gratis)
# Copia DATABASE_URL a .env

# Opción B: SQLite temporal (cambia schema.prisma)
# provider = "sqlite"
# url = "file:./dev.db"
```

---

## Estructura Coolify
```
coolify/
├── docker-compose.yml      # Este archivo
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── prisma/
│       └── schema.prisma
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```