import { db } from "@/lib/db";

export const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@meta-agent.local",
  role: "ADMIN",
} as const;

// El MVP todavía no tiene login. Esta función da un usuario "actor" estable
// para poder registrar quién hizo cada cambio (requisito de las reglas de
// seguridad del PLAN.md), sin bloquear el resto del dashboard en un sistema
// de autenticación completo. `upsert` es atómico: dos llamadas concurrentes
// nunca pueden chocar contra la restricción unique de `email`.
export async function getCurrentUser() {
  return db.user.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {},
    create: DEFAULT_ADMIN,
  });
}
