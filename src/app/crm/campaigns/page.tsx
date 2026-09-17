import { db } from "@/lib/db";

// Sin esto, Next.js prerenderiza esta página en el build (no tiene
// cookies/params dinámicos) y quedaría mostrando datos congelados del
// momento del deploy en vez de lo que hay en la base de datos ahora mismo.
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      adSets: {
        include: {
          ads: {
            include: {
              metrics: { orderBy: { date: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const rows = campaigns.map((c) => {
    const latestMetrics = c.adSets.flatMap((as) => as.ads.flatMap((ad) => ad.metrics));

    return {
      id: c.id,
      name: c.name,
      objective: c.objective,
      adSetCount: c.adSets.length,
      adCount: c.adSets.reduce((sum, as) => sum + as.ads.length, 0),
      spend: latestMetrics.reduce((sum, m) => sum + Number(m.spend), 0),
      impressions: latestMetrics.reduce((sum, m) => sum + m.impressions, 0),
      clicks: latestMetrics.reduce((sum, m) => sum + m.clicks, 0),
      results: latestMetrics.reduce((sum, m) => sum + m.results, 0),
    };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Campañas
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Datos leídos de Meta Ads (solo lectura, Nivel 1) y guardados aquí. El gasto,
        impresiones y clics son de la sincronización más reciente por anuncio — nunca
        se sobreescribe historial pasado.
      </p>

      <p className="mt-4 text-sm">
        <a
          href="/api/meta/sync"
          className="text-zinc-900 underline hover:no-underline dark:text-zinc-50"
        >
          Sincronizar ahora con Meta Ads →
        </a>
      </p>

      <section className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2 font-medium">Campaña</th>
              <th className="px-4 py-2 font-medium">Objetivo</th>
              <th className="px-4 py-2 font-medium">Conjuntos / Anuncios</th>
              <th className="px-4 py-2 font-medium">Gasto</th>
              <th className="px-4 py-2 font-medium">Impresiones</th>
              <th className="px-4 py-2 font-medium">Clics</th>
              <th className="px-4 py-2 font-medium">Resultados</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Todavía no hay campañas sincronizadas.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {r.name}
                </td>
                <td className="px-4 py-2 text-zinc-500">{r.objective ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">
                  {r.adSetCount} / {r.adCount}
                </td>
                <td className="px-4 py-2 text-zinc-500">${r.spend.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-500">{r.impressions}</td>
                <td className="px-4 py-2 text-zinc-500">{r.clicks}</td>
                <td className="px-4 py-2 text-zinc-500">{r.results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
