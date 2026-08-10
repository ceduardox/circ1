# PROYECTO CÍRCULO 1 - PLATAFORMA DE MENTORÍA COMUNITARIA

## 1. VISIÓN GENERAL

Plataforma web para comunidad de mentoría "Primer Millón" / "Somos Uno" (Mauro Stendel / Davie Forgaty).
Enfoque: **Neuroentrenamiento** - Reprogramación mental semanal mediante ejercicios interactivos, videos, quiz y afirmaciones.

---

## 2. STACK TECNOLÓGICO RECOMENDADO

### **Node.js + PostgreSQL** (Recomendado por velocidad y escalabilidad)

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Backend | **Node.js (Fastify/Express)** | I/O no bloqueante, mayor throughput, JSON nativo |
| Base de datos | **PostgreSQL** | ACID, JSONB, consultas complejas, escalabilidad |
| ORM | **Prisma** | Type-safe, migraciones, DX excelente |
| Auth | **JWT + bcrypt** | Stateless, escalable, seguro |
| Frontend | **React + Vite + TailwindCSS** | SPA rápida, responsive nativo, componentes reutilizables |
| State | **Zustand / React Query** | Ligero, server state management |
| Deploy | **Docker + Railway/Render/VPS** | Fácil escalado horizontal |

> **PHP + MySQL** sería opción B: más hosting barato, pero menor rendimiento en alta concurrencia y WebSockets.

---

## 3. ARQUITECTURA DE BASE DE DATOS

```sql
-- USUARIOS
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INT,
  country VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- DÍAS DEL PROGRAMA (7 días semana 1, expansibles)
program_days (
  id UUID PRIMARY KEY,
  day_number INT UNIQUE NOT NULL, -- 1, 2, 3...
  title VARCHAR(255),
  description TEXT,
  unlock_date DATE, -- opcional: fecha de desbloqueo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

-- CONTENIDO POR DÍA (polimórfico: video, quiz, ejercicio, frase)
day_contents (
  id UUID PRIMARY KEY,
  day_id UUID REFERENCES program_days(id),
  type VARCHAR(30) NOT NULL, -- 'video' | 'quiz' | 'exercise' | 'affirmation' | 'reflection'
  title VARCHAR(255),
  content JSONB, -- flexible: {video_url, questions[], prompt, affirmation_text, etc}
  order_index INT DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

-- PROGRESO USUARIO
user_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  day_id UUID REFERENCES program_days(id),
  content_id UUID REFERENCES day_contents(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed'
  answers JSONB, -- respuestas del usuario (reflexiones, quiz, etc)
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_id)
)

-- REFLEXIONES GUARDADAS (sueños, miedos, etc)
user_reflections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  day_id UUID REFERENCES program_days(id),
  reflection_type VARCHAR(50), -- 'dreams' | 'fears' | 'enthusiasm' | 'custom'
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- CONFIGURACIÓN ADMIN
admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB
)
```

---

## 4. FLUJO DE USUARIO

### **Registro / Login**
```
Registro: email + username + password + first_name + last_name + age + country
Login:    (email OR username) + password
JWT:      Access token (15min) + Refresh token (7d) en httpOnly cookie
```

### **Dashboard Usuario (Post-Login)**

#### **MÓVIL**
```
Header: [Logo] [User Avatar ▼]
        └─ Perfil (editable: nombre, apellido, edad, país, password)
        
Contenido del día actual:
  ┌─────────────────────┐
  │  DÍA 1 - ABRIENDO MENTE  │
  ├─────────────────────┤
  │ 🎯 Ejercicio: Sueños     │ → Formulario guardado
  │ 😨 Ejercicio: Miedos     │ → Formulario guardado
  │ 💪 Frase entusiasmo      │ → Leer + repetir (checkbox)
  │ 📹 Video: [FB/YouTube]   │ → Embed + check "Visto"
  └─────────────────────┘
  
  [Botón: VOLVER AL DÍA ANTERIOR] (si day > 1)
  [Bloqueado: DÍA SIGUIENTE] (hasta completar requeridos)
```

#### **DESKTOP (Sidebar)**
```
┌─────────┬────────────────────────────┐
│ LOGO    │  CONTENIDO DEL DÍA         │
│ MENU    │  (mismo que móvil, grid)   │
│ ☰       │                            │
│ 📅 Día 1│                            │
│ 📅 Día 2│                            │
│ 📅 Día 3│                            │
│    ...  │                            │
│ ⚙️ Admin│                            │
└─────────┴────────────────────────────┘
```

### **Regla de Navegación Temporal**
- ✅ **Puede volver** a días anteriores (revisar, re-hacer)
- ❌ **No puede avanzar** al día siguiente hasta completar **contenidos requeridos** del día actual
- 🔓 Admin puede desbloquear manualmente

---

## 5. TIPOS DE CONTENIDO (NEUROENTRENAMIENTO)

| Tipo | Descripción | Estructura JSONB `content` |
|------|-------------|----------------------------|
| `reflection` | Escritura guiada (sueños, miedos) | `{prompt: "¿Cuáles son tus sueños?", placeholder: "Escribe aquí...", min_chars: 50}` |
| `affirmation` | Frase para leer/repetir | `{text: "Yo soy capaz...", repeat_count: 3, audio_url?: ""}` |
| `video` | Video embebido (FB/YouTube) | `{url: "https://fb.com/...", provider: "facebook", duration: 1200, autoplay: false}` |
| `quiz` | Preguntas interactivas | `{questions: [{id, text, type: "single|multiple|text", options: [], correct: []}]}` |
| `mental_exercise` | Ejercicio cognitivo | `{instruction: "Visualiza...", duration_min: 5, steps: []}` |
| `confidence_task` | Reto de confianza | `{task: "Habla con un extraño", evidence_type: "text|photo"}` |

---

## 6. PANEL ADMINISTRATIVO

### **Vista: Gestión de Días**
```
┌────────────────────────────────────────────────────┐
│  SEMANA 1: ABRIENDO LA MENTE                       │
├──────────┬──────────────────┬──────────┬───────────┤
│ Día #    │ Título           │ Estado   │ Acciones  │
├──────────┼──────────────────┼──────────┼───────────┤
│ 1        │ Sueños y Miedos  │ ✅ Activo │ [Editar]  │
│ 2        │ Reprogramación   │ 🔒 Bloq.  │ [Editar]  │
│ 3        │ Confianza        │ 🔒 Bloq.  │ [Editar]  │
└──────────┴──────────────────┴──────────┴───────────┘
```

### **Editor de Contenido por Día (Drag & Drop)**
```
DÍA 1 - CONTENIDOS (ordenables)
┌─────────────────────────────────────────┐
│ [+] Agregar: ☐ Video  ☐ Quiz  ☐ Texto   │
├─────────────────────────────────────────┤
│ 1. 🎯 Reflexión: "Tus Sueños"     [⋮]   │
│    Prompt: "Si no tienes sueños, escríbelos"  │
│    [Editar] [Eliminar] [↑↓]                  │
├─────────────────────────────────────────┤
│ 2. 😨 Reflexión: "Tus Miedos"       [⋮]   │
├─────────────────────────────────────────┤
│ 3. 💪 Frase: "Yo creo en mí"        [⋮]   │
│    Repetir 3 veces ☑️☑️☑️                   │
├─────────────────────────────────────────┤
│ 4. 📹 Video FB: "Mauro Stendel"     [⋮]   │
│    URL: https://fb.com/watch/...            │
└─────────────────────────────────────────┘
```

### **Vista: Usuarios y Progreso**
- Tabla paginada: Usuario | Día actual | % Completado | Último acceso
- Filtros: por día, por país, por fecha registro
- Exportar CSV

### **Vista: Analytics**
- Usuarios activos/día
- Tasa completitud por día
- Drop-off points (dónde se atoran)
- Respuestas de reflexiones (word cloud, sentiment)

---

## 7. ENDPOINTS API (REST)

### **Auth**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/me (perfil: name, age, country, password)
```

### **Programa (Usuario)**
```
GET    /api/program/current-day          → Día actual del usuario
GET    /api/program/day/:dayNumber       → Contenidos del día (si desbloqueado)
POST   /api/program/day/:dayNumber/content/:contentId/complete
POST   /api/program/reflection           → Guardar reflexión (sueños, miedos, etc)
GET    /api/program/progress             → Progreso completo usuario
POST   /api/program/previous-day         → Navegar día anterior
```

### **Admin**
```
GET    /api/admin/dashboard/stats
GET    /api/admin/users
GET    /api/admin/program/days
POST   /api/admin/program/days
PUT    /api/admin/program/days/:id
DELETE /api/admin/program/days/:id
POST   /api/admin/program/days/:dayId/contents
PUT    /api/admin/program/contents/:id
DELETE /api/admin/program/contents/:id
PUT    /api/admin/program/days/:dayId/reorder
GET    /api/admin/analytics/overview
```

---

## 8. FRONTEND - ESTRUCTURA COMPONENTES

```
src/
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx          # Contenido día actual
│   ├── DayView.tsx            # Vista día específico
│   ├── Profile.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── DaysManager.tsx
│       ├── ContentEditor.tsx
│       ├── UsersTable.tsx
│       └── Analytics.tsx
├── components/
│   ├── ui/                    # Button, Input, Card, Modal, Sidebar, Header
│   ├── program/
│   │   ├── ReflectionForm.tsx
│   │   ├── AffirmationCard.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── QuizComponent.tsx
│   │   ├── MentalExercise.tsx
│   │   └── ProgressRing.tsx
│   └── layout/
│       ├── MobileHeader.tsx
│       ├── DesktopSidebar.tsx
│       └── UserMenu.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProgram.ts
│   └── useAdmin.ts
├── services/
│   ├── api.ts
│   └── auth.ts
└── store/
    ├── authStore.ts
    └── programStore.ts
```

---

## 9. REGLAS DE NEGOCIO CLAVE

1. **Un día a la vez**: Usuario ve solo su día actual + anteriores
2. **Contenido requerido vs opcional**: `is_required` en `day_contents`
3. **Auto-desbloqueo**: Al completar todos `required` del día → siguiente día disponible
4. **Admin override**: Puede desbloquear cualquier día a cualquier usuario
5. **Reflexiones persistentes**: Se guardan automáticamente (autosave cada 30s)
6. **Video tracking**: Marcar "Visto" solo tras 80% reproducción (opcional)
7. **Quiz scoring**: Mostrar resultado inmediato, permitir reintentar

---

## 10. ROADMAP SEMANAL

| Semana | Entregable |
|--------|------------|
| 1 | Setup repo, DB, Auth (Register/Login/JWT), Perfil usuario |
| 2 | Dashboard usuario (móvil + desktop), Navegación días, Progress |
| 3 | Componentes contenido: Reflexión, Frase, Video, Quiz |
| 4 | Panel Admin: CRUD Días, Editor contenidos Drag&Drop |
| 5 | Panel Admin: Usuarios, Analytics, Export |
| 6 | Pulido UX, Animaciones, PWA, Tests, Deploy |

---

## 11. CONSIDERACIONES TÉCNICAS

- **Seguridad**: Rate limit login, CORS estricto, Helmet, Sanitización inputs
- **Performance**: React Query cache, Lazy loading componentes, Imágenes WebP
- **Accesibilidad**: ARIA labels, Contraste, Navegación teclado
- **i18n**: Preparar para español/inglés (react-i18next)
- **PWA**: Service Worker para offline (leer reflexiones guardadas)
- **Webhooks**: Notificar a n8n/Make cuando user completa día → email/WhatsApp

---

## 12. PRÓXIMOS PASOS

1. **Confirmar stack**: ¿Node.js + PostgreSQL OK? ¿O prefieres PHP?
2. **Definir hosting**: ¿VPS propio? ¿Railway/Render/PlanetScale?
3. **Diseño UI**: ¿Tienes Figma/referencias? ¿O usamos shadcn/ui + Tailwind?
4. **Iniciar Semana 1**: Crear repo, Docker, Prisma schema, Auth module

---

**¿Empezamos con la Semana 1?**