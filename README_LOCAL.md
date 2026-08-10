# Guía de Desarrollo Local - Círculo 1

Este documento detalla los pasos para levantar el entorno de desarrollo local de **Círculo 1** (Frontend en puerto 3000 y Backend en puerto 3001) usando tu base de datos local PostgreSQL.

## Requisitos Previos

El entorno local depende de las siguientes instalaciones en tu equipo:
1. **Node.js** (v18 o superior recomendado)
2. **PostgreSQL** corriendo localmente en el puerto `5432` con usuario `postgres` y contraseña `postgres` (instalado y funcionando como servicio).

## Estructura de Puertos

- **Frontend (Vite / React):** [http://localhost:3000](http://localhost:3000)
- **Backend (Fastify / Node):** [http://localhost:3001](http://localhost:3001)
- **Base de Datos (PostgreSQL):** `localhost:5432` (BD: `circulo1`)

---

## Cómo Iniciar el Entorno Local

Puedes iniciar todo de forma automática con un solo comando:

### Opción A (Doble Clic):
1. Abre tu explorador de archivos en la raíz del proyecto.
2. Haz doble clic en el archivo `start-local.cmd`.

### Opción B (PowerShell):
1. Abre una consola de **PowerShell** en la raíz del proyecto.
2. Ejecuta el script:
   ```powershell
   .\start-local.ps1
   ```

---

## ¿Qué hace el Script Automáticamente?

1. **Verificación de Base de Datos:** Comprueba si tu servidor PostgreSQL está activo en el puerto `5432`.
2. **Configuración de Entorno:** Copia el archivo `.env` de la raíz a la carpeta `/backend` en caso de que falte.
3. **Instalación de Dependencias:** Ejecuta `npm install` automáticamente tanto en el frontend como en el backend si no detecta las carpetas `node_modules`.
4. **Sincronización de Base de Datos:** Ejecuta `npx prisma generate` para asegurar que el cliente de base de datos de Prisma esté al día.
5. **Servidores en Paralelo:** Lanza el backend (puerto 3001) y el frontend (puerto 3000) en ventanas de PowerShell independientes.

---

## Base de Datos (Prisma)

Si necesitas hacer cambios en el esquema de base de datos (`backend/prisma/schema.prisma`):

- **Crear y aplicar una nueva migración:**
  ```bash
  cd backend
  npx prisma migrate dev --name descripcion_del_cambio
  ```
- **Abrir el visor de base de datos gráfico (Prisma Studio):**
  ```bash
  cd backend
  npx prisma studio
  ```
- **Volver a poblar la base de datos con datos de prueba (Seed):**
  ```bash
  cd backend
  npm run prisma:seed
  ```

---

## Preparación para Producción / Coolify

Para subir este proyecto a Coolify:
1. Asegúrate de configurar las variables de entorno detalladas en el archivo [COOLIFY_DEPLOY.md](file:///g:/RYZTOR/CIRCULO1/COOLIFY_DEPLOY.md).
2. Coolify utilizará el archivo [docker-compose.yml](file:///g:/RYZTOR/CIRCULO1/docker-compose.yml) de la raíz del proyecto para crear automáticamente los contenedores de PostgreSQL, Backend y Frontend, realizando la compilación correcta.
3. No es necesario realizar ningún cambio en la base de datos local para producción; Coolify inyectará sus propias variables automáticamente en base al servicio PostgreSQL de la nube.
