"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { optionalString, parseEnum, parseMoney, parseOptionalMoney, requireString } from "@/lib/form";
import { LEAD_STATUSES } from "@/lib/statuses";
import { DealStatus, LeadStatus } from "@prisma/client";

function revalidateLead(leadId: string) {
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
}

// Cambia el estado de un lead y agrega la fila de historial correspondiente
// en una sola transacción interactiva (lectura + escritura), para que dos
// cambios concurrentes sobre el mismo lead no puedan generar historial
// inconsistente. No hace nada si el lead ya está en ese estado.
async function transitionLeadStatus(
  leadId: string,
  toStatus: LeadStatus,
  note: string | null,
  userId: string
) {
  await db.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });

    if (lead.status === toStatus) return;

    await tx.lead.update({ where: { id: leadId }, data: { status: toStatus } });
    await tx.leadStatusHistory.create({
      data: { leadId, fromStatus: lead.status, toStatus, note, changedById: userId },
    });
  });
}

export async function createLead(formData: FormData) {
  const name = requireString(formData, "name");
  const email = optionalString(formData, "email");
  const phone = optionalString(formData, "phone");
  const source = optionalString(formData, "source");

  const user = await getCurrentUser();

  // Un solo write anidado: el lead y su primera fila de historial se crean
  // atómicamente, así nunca queda un lead sin su entrada "Creado" inicial.
  await db.lead.create({
    data: {
      name,
      email,
      phone,
      source,
      statusHistory: {
        create: { toStatus: LeadStatus.NEW, note: "Lead creado", changedById: user.id },
      },
    },
  });

  revalidatePath("/crm");
}

export async function changeLeadStatus(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const toStatus = parseEnum(formData, "toStatus", LEAD_STATUSES);
  const note = optionalString(formData, "note");
  const user = await getCurrentUser();

  await transitionLeadStatus(leadId, toStatus, note, user.id);
  revalidateLead(leadId);
}

const INTERACTION_TYPES = ["llamada", "mensaje", "email", "reunion", "otro"] as const;

export async function addInteraction(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const type = parseEnum(formData, "type", INTERACTION_TYPES);
  const note = requireString(formData, "note");

  const user = await getCurrentUser();

  await db.interaction.create({
    data: { leadId, type, note, createdById: user.id },
  });

  revalidatePath(`/crm/${leadId}`);
}

export async function registerDeal(formData: FormData) {
  const leadId = requireString(formData, "leadId");
  const amount = parseMoney(formData, "amount");
  const margin = parseOptionalMoney(formData, "margin");
  const status = optionalString(formData, "status") === "LOST" ? DealStatus.LOST : DealStatus.WON;

  const user = await getCurrentUser();

  // El registro de la venta y (si aplica) el paso del lead a Cliente
  // suceden en la misma transacción: una venta ganada nunca debe quedar
  // registrada sin que el lead refleje ese cambio, ni viceversa.
  await db.$transaction(async (tx) => {
    await tx.deal.create({ data: { leadId, amount, margin, status } });

    if (status === DealStatus.WON) {
      const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });

      if (lead.status !== LeadStatus.CUSTOMER) {
        await tx.lead.update({ where: { id: leadId }, data: { status: LeadStatus.CUSTOMER } });
        await tx.leadStatusHistory.create({
          data: {
            leadId,
            fromStatus: lead.status,
            toStatus: LeadStatus.CUSTOMER,
            note: "Venta registrada",
            changedById: user.id,
          },
        });
      }
    }
  });

  revalidateLead(leadId);
}
