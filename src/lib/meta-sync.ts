import { db } from "@/lib/db";
import { listAdInsights, listAdSets, listAds, listCampaigns } from "@/lib/meta";

export type SyncSummary = {
  campaigns: number;
  adSets: number;
  ads: number;
  metricsSaved: number;
};

// Trae campañas/conjuntos/anuncios/insights de Meta y los guarda en las
// tablas que ya existían para esto (Fase 2 del PLAN.md: solo leer y
// guardar, sin insights propios ni recomendaciones todavía).
export async function syncMetaAccount(adAccountId: string): Promise<SyncSummary> {
  const account = await db.adAccount.upsert({
    where: { externalId: adAccountId },
    update: {},
    create: { externalId: adAccountId, name: `Cuenta ${adAccountId}` },
  });

  const [campaigns, adSets, ads] = await Promise.all([
    listCampaigns(adAccountId),
    listAdSets(adAccountId),
    listAds(adAccountId),
  ]);

  for (const c of campaigns) {
    await db.campaign.upsert({
      where: { externalId: c.id },
      update: { name: c.name, objective: c.objective ?? null },
      create: {
        externalId: c.id,
        name: c.name,
        objective: c.objective ?? null,
        adAccountId: account.id,
      },
    });
  }

  for (const as of adSets) {
    const campaign = await db.campaign.findUnique({ where: { externalId: as.campaign_id } });

    if (!campaign) continue; // el conjunto pertenece a una campaña que no vino en esta sincronización
    await db.adSet.upsert({
      where: { externalId: as.id },
      update: { name: as.name },
      create: { externalId: as.id, name: as.name, campaignId: campaign.id },
    });
  }

  for (const a of ads) {
    const adSet = await db.adSet.findUnique({ where: { externalId: a.adset_id } });

    if (!adSet) continue;
    await db.ad.upsert({
      where: { externalId: a.id },
      update: { name: a.name },
      create: { externalId: a.id, name: a.name, adSetId: adSet.id },
    });
  }

  const insights = ads.length > 0 ? await listAdInsights(adAccountId) : [];
  let metricsSaved = 0;

  for (const i of insights) {
    if (!i.ad_id) continue;
    const ad = await db.ad.findUnique({ where: { externalId: i.ad_id } });

    if (!ad) continue;

    const results = (i.actions ?? []).reduce((sum, action) => sum + Number(action.value || 0), 0);

    // Siempre inserta una fila nueva (nunca actualiza una pasada): así el
    // historial propio queda intacto aunque Meta corrija datos después.
    await db.metricSnapshot.create({
      data: {
        date: new Date(),
        adId: ad.id,
        spend: Number(i.spend ?? 0),
        impressions: Number(i.impressions ?? 0),
        clicks: Number(i.clicks ?? 0),
        results,
      },
    });
    metricsSaved += 1;
  }

  return { campaigns: campaigns.length, adSets: adSets.length, ads: ads.length, metricsSaved };
}
