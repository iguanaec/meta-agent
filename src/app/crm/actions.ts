"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { LeadStatus } from "@prisma/client";

const LEAD_STATUSES = Object.values(LeadStatus);

function requireString(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`El campo "${field}" es obligatorio.`);
  }
  return value.trim();
}

export async function createLead(formData: FormData) {
  const name = requireString(formData, "name");
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const source = (formData.get("source") as string | null)?.trim() || null;

  const user = await getCurrentUser();

  const lead = await db.lead.create({
    data: { name, email, phone, source, status: LeadStatus.NEW },
  });

  await db.leadStatusHistory.create({
    data: {
      leadId: lead.id,
      toStatus: LeadStatus.NEW,
      note: "Lead creado",
      changedById: user.id,
    },
  });

  revalidatePath("/crm");
}

export async function changeLeadStatus(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const toStatusRaw = requireString(formData, "toStatus");
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!LEAD_STATUSES.includes(toStatusRaw as LeadStatus)) {
    throw new Error("Estado inválido.");
  }
  const toStatus = toStatusRaw as LeadStatus;

  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const user = await getCurrentUser();

  if (lead.status !== toStatus) {
    await db.$transaction([
      db.lead.update({ where: { id: leadId }, data: { status: toStatus } }),
      db.leadStatusHistory.create({
        data: {
          leadId,
          fromStatus: lead.status,
          toStatus,
          note,
          changedById: user.id,
        },
      }),
    ]);
  }

  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
}

export async function addInteraction(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const type = requireString(formData, "type");
  const note = requireString(formData, "note");

  const user = await getCurrentUser();

  await db.interaction.create({
    data: { leadId, type, note, createdById: user.id },
  });

  revalidatePath(`/crm/${leadId}`);
}

export async function registerDeal(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const amountRaw = requireString(formData, "amount");
  const marginRaw = (formData.get("margin") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null) === "LOST" ? "LOST" : "WON";

  const amount = Number(amountRaw);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error("Monto inválido.");
  }
  const margin = marginRaw !== null && marginRaw !== "" ? Number(marginRaw) : null;
  if (margin !== null && Number.isNaN(margin)) {
    throw new Error("Margen inválido.");
  }

  await db.deal.create({
    data: { leadId, amount, margin, status },
  });

  if (status === "WON") {
    const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.status !== LeadStatus.CUSTOMER) {
      const user = await getCurrentUser();
      await db.$transaction([
        db.lead.update({ where: { id: leadId }, data: { status: LeadStatus.CUSTOMER } }),
        db.leadStatusHistory.create({
          data: {
            leadId,
            fromStatus: lead.status,
            toStatus: LeadStatus.CUSTOMER,
            note: "Venta registrada",
            changedById: user.id,
          },
        }),
      ]);
    }
  }

  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
}
