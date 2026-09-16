import { DealStatus, LeadStatus } from "@prisma/client";

export const LEAD_STATUSES = Object.values(LeadStatus);

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  QUALIFIED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CUSTOMER: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  LOST: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  WON: "Ganada",
  LOST: "Perdida",
};
