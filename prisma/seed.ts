import { PrismaClient, LeadStatus } from "@prisma/client";
import { DEFAULT_ADMIN } from "../src/lib/current-user";

const db = new PrismaClient();

async function main() {
  const admin = await db.user.upsert({
    where: { email: DEFAULT_ADMIN.email },
    update: {},
    create: DEFAULT_ADMIN,
  });

  const leadsSeed = [
    { name: "Carlos Ramírez", source: "Campaña Verano - Leads", status: LeadStatus.QUALIFIED },
    { name: "Ana Torres", source: "Campaña Verano - Leads", status: LeadStatus.CONTACTED },
    { name: "Luis Fernández", source: "Retargeting Catálogo", status: LeadStatus.NEW },
    { name: "María González", source: "Retargeting Catálogo", status: LeadStatus.CUSTOMER },
    { name: "Jorge Pérez", source: "Campaña Verano - Leads", status: LeadStatus.LOST },
  ];

  for (const seed of leadsSeed) {
    const existing = await db.lead.findFirst({ where: { name: seed.name } });

    if (existing) continue;

    const lead = await db.lead.create({
      data: {
        name: seed.name,
        source: seed.source,
        statusHistory: {
          create: { toStatus: LeadStatus.NEW, note: "Lead creado (dato de ejemplo)", changedById: admin.id },
        },
      },
    });

    if (seed.status !== LeadStatus.NEW) {
      await db.lead.update({ where: { id: lead.id }, data: { status: seed.status } });
      await db.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          fromStatus: LeadStatus.NEW,
          toStatus: seed.status,
          note: "Avance de ejemplo para poblar el historial",
          changedById: admin.id,
        },
      });
    }

    if (seed.status === LeadStatus.CUSTOMER) {
      await db.deal.create({
        data: {
          leadId: lead.id,
          amount: 1500,
          margin: 450,
          status: "WON",
        },
      });
    }
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
