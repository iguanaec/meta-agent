import { STATUS_LABELS } from "@/lib/statuses";
import type { Interaction, LeadStatusHistory, User } from "@prisma/client";

export type TimelineEntry = {
  id: string;
  createdAt: Date;
  kind: "status" | "interaction";
  label: string;
  note: string | null;
  by: string;
};

type StatusHistoryWithActor = LeadStatusHistory & { changedBy: User | null };

type InteractionWithActor = Interaction & { createdBy: User | null };

export function buildLeadTimeline(
  statusHistory: StatusHistoryWithActor[],
  interactions: InteractionWithActor[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...statusHistory.map((h) => ({
      id: `status-${h.id}`,
      createdAt: h.createdAt,
      kind: "status" as const,
      label: h.fromStatus
        ? `${STATUS_LABELS[h.fromStatus]} → ${STATUS_LABELS[h.toStatus]}`
        : `Creado como ${STATUS_LABELS[h.toStatus]}`,
      note: h.note,
      by: h.changedBy?.name ?? "Sistema",
    })),
    ...interactions.map((i) => ({
      id: `interaction-${i.id}`,
      createdAt: i.createdAt,
      kind: "interaction" as const,
      label: i.type,
      note: i.note,
      by: i.createdBy?.name ?? "Sistema",
    })),
  ];

  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
