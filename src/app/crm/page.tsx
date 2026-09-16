import Link from "next/link";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";
import { createLead } from "./actions";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  CUSTOMER: "Cliente",
  LOST: "Perdido",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  QUALIFIED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CUSTOMER: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  LOST: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function CrmPage({
  searchParams,
}: PageProps<"/crm">) {
  const params = await searchParams;
  const statusFilterRaw = typeof params.status === "string" ? params.status : undefined;
  const statusFilter =
    statusFilterRaw && statusFilterRaw in STATUS_LABELS
      ? (statusFilterRaw as LeadStatus)
      : undefined;

  const [leads, counts] = await Promise.all([
    db.lead.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { updatedAt: "desc" },
      include: { deals: true },
    }),
    db.lead.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count])
  ) as Partial<Record<LeadStatus, number>>;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Leads
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Registro manual de leads y ventas. Esta es la fuente de verdad de negocio —
        independiente de lo que reporte Meta Ads.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/crm"
          className={`rounded-full px-3 py-1 ${
            !statusFilter
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          Todos ({leads.length + 0})
        </Link>
        {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((status) => (
          <Link
            key={status}
            href={`/crm?status=${status}`}
            className={`rounded-full px-3 py-1 ${
              statusFilter === status
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {STATUS_LABELS[status]} ({countByStatus[status] ?? 0})
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Origen</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Ventas</th>
              <th className="px-4 py-2 font-medium">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  No hay leads con este filtro todavía.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-950"
              >
                <td className="px-4 py-2">
                  <Link href={`/crm/${lead.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-500">{lead.source ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lead.status]}`}
                  >
                    {STATUS_LABELS[lead.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-zinc-500">
                  {lead.deals.filter((d) => d.status === "WON").length} ganada(s)
                </td>
                <td className="px-4 py-2 text-zinc-400">
                  {lead.updatedAt.toLocaleDateString("es-MX")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 max-w-md">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Agregar lead nuevo
        </h2>
        <form action={createLead} className="mt-3 flex flex-col gap-3">
          <input
            name="name"
            placeholder="Nombre completo"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (opcional)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="phone"
            placeholder="Teléfono (opcional)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="source"
            placeholder="Origen (ej. nombre de campaña)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Crear lead
          </button>
        </form>
      </section>
    </div>
  );
}
