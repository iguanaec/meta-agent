# Meta Agent — CRM y bitácora del agente

Ver `PLAN.md` para el plan de producto completo. Este repo contiene el MVP Nivel 1:
un CRM básico (leads, ventas, historial) construido con Next.js + Prisma + PostgreSQL,
pensado como base sobre la que se conectará el agente de Meta Ads más adelante.

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (local o vía `docker compose up -d db`, si tienes Docker disponible)

## Configuración

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` si tu Postgres no usa las
   credenciales por defecto (`metaagent` / `metaagent` en `localhost:5432`).
2. (Opcional, para la conexión a Meta) agrega `META_ACCESS_TOKEN` y
   `META_AD_ACCOUNT_ID` — ver "Conexión a Meta Ads" abajo.
3. Instala dependencias: `npm install`
4. Aplica el esquema: `npx prisma migrate dev`
5. Carga datos de ejemplo (opcional): `npm run db:seed`
6. Arranca el servidor: `npm run dev` y abre [http://localhost:3000](http://localhost:3000)
   (redirige a `/crm`).

## Estructura

- `prisma/schema.prisma` — modelo de datos: CRM (leads, historial de estados,
  interacciones, ventas) + bitácora del agente (cuentas/campañas/anuncios de Meta,
  métricas diarias, insights, recomendaciones, aprobaciones, auditoría). El bloque
  de Meta está creado pero todavía sin conexión real — eso es la siguiente etapa
  del plan (Fase 2 de `PLAN.md`).
- `src/app/crm/` — dashboard del CRM: lista de leads con filtros por estado,
  alta de leads, y detalle de cada lead con una línea de tiempo (historial de
  cambios de estado, interacciones y ventas).
- `src/app/crm/actions.ts` — Server Actions que hacen los cambios (nunca
  sobreescriben el historial, siempre agregan una fila nueva).

## Conexión a Meta Ads (Fase 2, solo lectura)

- `src/lib/meta.ts` — cliente mínimo de la Marketing API (Graph API), sin
  ninguna función de escritura a propósito.
- `src/lib/meta-sync.ts` — trae campañas/conjuntos/anuncios/insights de una
  cuenta y los guarda en las tablas de `schema.prisma` (nunca sobreescribe
  una métrica pasada, siempre agrega una fila nueva).
- `GET /api/meta/sync` — dispara la sincronización (usa `META_AD_ACCOUNT_ID`).
  Es un `GET` a propósito: solo lee de Meta y escribe en nuestra propia base,
  nada se modifica en Meta, así que se puede probar abriendo la URL.
- `src/app/crm/campaigns/` — muestra lo sincronizado.
- Variables necesarias: `META_ACCESS_TOKEN` (token de un "usuario de sistema"
  en Business Settings, con permisos `ads_read` + `read_insights`) y
  `META_AD_ACCOUNT_ID` (el ID numérico de la cuenta, sin el prefijo `act_`).

## Notas

- Todavía no hay login: las acciones se registran bajo un usuario "Admin" por
  defecto (`src/lib/current-user.ts`). Es un punto pendiente antes de tener más
  de un usuario o de exponer esto fuera de un entorno de confianza.
- La ruta `/api/meta/sync` tampoco tiene autenticación todavía — mismo punto
  pendiente. Solo lee de Meta y escribe en nuestra propia base, así que el
  riesgo es bajo, pero no debería quedar así una vez haya más de un usuario.
