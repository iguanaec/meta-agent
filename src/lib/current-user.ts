import { db } from "@/lib/db";

const DEFAULT_ADMIN_EMAIL = "admin@meta-agent.local";

// El MVP todavía no tiene login. Esta función da un usuario "actor" estable
// para poder registrar quién hizo cada cambio (requisito de las reglas de
// seguridad del PLAN.md), sin bloquear el resto del dashboard en un sistema
// de autenticación completo.
export async function getCurrentUser() {
  return db.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {},
    create: {
      name: "Admin",
      email: DEFAULT_ADMIN_EMAIL,
      role: "ADMIN",
    },
  });
}
