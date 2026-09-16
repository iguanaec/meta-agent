import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DEAL_STATUS_LABELS, STATUS_LABELS } from "@/lib/statuses";
import { buildLeadTimeline } from "@/lib/timeline";
import { addInteraction, changeLeadStatus, registerDeal } from "../actions";
import { TextInput, Select, SubmitButton } from "../ui";

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

  const timeline = buildLeadTimeline(lead.statusHistory, lead.interactions);

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
            {/* key={lead.status} fuerza a React a remontar el <select> cuando
                cambia el estado del lead, para que defaultValue se re-aplique
                tras el revalidate (si no, el navegador conserva la selección
                anterior en el mismo nodo DOM). */}
            <Select key={lead.status} name="toStatus" defaultValue={lead.status}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <TextInput name="note" placeholder="Nota (opcional)" />
            <SubmitButton>Guardar estado</SubmitButton>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Registrar venta
          </h2>
          <form action={registerDeal} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <TextInput name="amount" type="number" step="0.01" min="0" placeholder="Monto" required />
            <TextInput name="margin" type="number" step="0.01" placeholder="Margen (opcional)" />
            <Select name="status" defaultValue="WON">
              {Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <SubmitButton>Guardar venta</SubmitButton>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Ventas
        </h2>
        {lead.deals.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Sin ventas registradas todavía.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {lead.deals.map((deal) => (
              <li key={deal.id} className="flex items-baseline justify-between gap-2">
                <span className="text-zinc-900 dark:text-zinc-50">
                  ${deal.amount.toString()}
                  {deal.margin !== null && (
                    <span className="text-zinc-500"> (margen ${deal.margin.toString()})</span>
                  )}
                </span>
                <span className="text-zinc-400">
                  {DEAL_STATUS_LABELS[deal.status]} · {deal.closedAt.toLocaleDateString("es-MX")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Agregar interacción
        </h2>
        <form action={addInteraction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="leadId" value={lead.id} />
          <Select name="type" defaultValue="llamada">
            <option value="llamada">Llamada</option>
            <option value="mensaje">Mensaje</option>
            <option value="email">Email</option>
            <option value="reunion">Reunión</option>
            <option value="otro">Otro</option>
          </Select>
          <TextInput name="note" placeholder="¿Qué pasó?" required className="flex-1" />
          <SubmitButton>Agregar</SubmitButton>
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
