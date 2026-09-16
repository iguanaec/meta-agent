import Link from "next/link";
import { db } from "@/lib/db";
import { DealStatus } from "@prisma/client";
import { LEAD_STATUSES, STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";
import { createLead } from "./actions";
import { TextInput, SubmitButton } from "./ui";

function pillClassName(active: boolean) {
  return `rounded-full px-3 py-1 ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
  }`;
}

export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  const params = await searchParams;
  const statusParam = params.status;
  const statusFilterRaw = Array.isArray(statusParam) ? statusParam[0] : statusParam;
  const statusFilter = LEAD_STATUSES.find((status) => status === statusFilterRaw);

  const [leads, counts] = await Promise.all([
    db.lead.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { deals: { where: { status: DealStatus.WON } } } } },
    }),
    db.lead.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count]));
  const totalLeads = counts.reduce((sum, c) => sum + c._count, 0);

  const filterPills = [
    { href: "/crm", label: `Todos (${totalLeads})`, active: !statusFilter },
    ...LEAD_STATUSES.map((status) => ({
      href: `/crm?status=${status}`,
      label: `${STATUS_LABELS[status]} (${countByStatus.get(status) ?? 0})`,
      active: statusFilter === status,
    })),
  ];

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
        {filterPills.map((pill) => (
          <Link key={pill.href} href={pill.href} className={pillClassName(pill.active)}>
            {pill.label}
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
                  {lead._count.deals} ganada(s)
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
          <TextInput name="name" placeholder="Nombre completo" required />
          <TextInput name="email" type="email" placeholder="Email (opcional)" />
          <TextInput name="phone" placeholder="Teléfono (opcional)" />
          <TextInput name="source" placeholder="Origen (ej. nombre de campaña)" />
          <SubmitButton>Crear lead</SubmitButton>
        </form>
      </section>
    </div>
  );
}
