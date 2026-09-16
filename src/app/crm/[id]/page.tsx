import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";
import { addInteraction, changeLeadStatus, registerDeal } from "../actions";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
};

export default async function LeadDetailPage({ params }: PageProps<"/crm/[id]">) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: true } },
      interactions: { orderBy: { createdAt: "desc" }, include: { createdBy: true } },
      deals: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  type TimelineEntry = {
    id: string;
    createdAt: Date;
    kind: "status" | "interaction";
    label: string;
    note: string | null;
    by: string;
  };

  const timeline: TimelineEntry[] = [
    ...lead.statusHistory.map((h) => ({
      id: `status-${h.id}`,
      createdAt: h.createdAt,
      kind: "status" as const,
      label: h.fromStatus
        ? `${STATUS_LABELS[h.fromStatus]} → ${STATUS_LABELS[h.toStatus]}`
        : `Creado como ${STATUS_LABELS[h.toStatus]}`,
      note: h.note,
      by: h.changedBy?.name ?? "Sistema",
    })),
    ...lead.interactions.map((i) => ({
      id: `interaction-${i.id}`,
      createdAt: i.createdAt,
      kind: "interaction" as const,
      label: i.type,
      note: i.note,
      by: i.createdBy?.name ?? "Sistema",
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/crm" className="text-sm text-zinc-500 hover:underline">
        ← Volver a Leads
      </Link>

      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {lead.name}
        </h1>
        <span className="text-sm text-zinc-500">
          Estado actual: <strong>{STATUS_LABELS[lead.status]}</strong>
        </span>
      </div>
      <div className="mt-1 text-sm text-zinc-500">
        {lead.email && <span className="mr-4">{lead.email}</span>}
        {lead.phone && <span className="mr-4">{lead.phone}</span>}
        {lead.source && <span>Origen: {lead.source}</span>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Cambiar estado
          </h2>
          <form action={changeLeadStatus} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <select
              key={lead.status}
              name="toStatus"
              defaultValue={lead.status}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="note"
              placeholder="Nota (opcional)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Guardar estado
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Registrar venta
          </h2>
          <form action={registerDeal} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              name="margin"
              type="number"
              step="0.01"
              placeholder="Margen (opcional)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <select
              name="status"
              defaultValue="WON"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="WON">Ganada</option>
              <option value="LOST">Perdida</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Guardar venta
            </button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Agregar interacción
        </h2>
        <form action={addInteraction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="leadId" value={lead.id} />
          <select
            name="type"
            defaultValue="llamada"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="llamada">Llamada</option>
            <option value="mensaje">Mensaje</option>
            <option value="email">Email</option>
            <option value="reunion">Reunión</option>
            <option value="otro">Otro</option>
          </select>
          <input
            name="note"
            placeholder="¿Qué pasó?"
            required
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Agregar
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Historial
        </h2>
        <ol className="mt-3 flex flex-col gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
          {timeline.length === 0 && (
            <li className="text-sm text-zinc-400">Sin actividad todavía.</li>
          )}
          {timeline.map((entry) => (
            <li key={entry.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-zinc-400" />
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {entry.kind === "status" ? entry.label : `Interacción: ${entry.label}`}
                </span>
                <span className="text-xs text-zinc-400">
                  {entry.createdAt.toLocaleString("es-MX")}
                </span>
              </div>
              {entry.note && <p className="mt-0.5 text-zinc-500">{entry.note}</p>}
              <p className="mt-0.5 text-xs text-zinc-400">por {entry.by}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
