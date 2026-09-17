// Cliente de solo lectura para la Marketing API de Meta. Sin dependencias
// externas (fetch nativo). No expone ninguna función de escritura —
// intencional: el agente todavía está en Nivel 1 (solo lectura) del PLAN.md.

const GRAPH_API_VERSION = "v21.0";

const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaCampaign = { id: string; name: string; objective?: string; status: string };

export type MetaAdSet = { id: string; name: string; campaign_id: string; status: string };

export type MetaAd = { id: string; name: string; adset_id: string; status: string };

export type MetaInsight = {
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
};

function requireMetaToken(): string {
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "META_ACCESS_TOKEN no está configurado. Agrégalo como variable de entorno (nunca en el código)."
    );
  }

  return token;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${GRAPH_API_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  url.searchParams.set("access_token", requireMetaToken());

  return url.toString();
}

type GraphErrorBody = { error?: { message: string; type?: string; code?: number } };

type GraphListBody<T> = GraphErrorBody & { data: T[]; paging?: { next?: string } };

async function fetchGraph<T>(url: string): Promise<GraphListBody<T>> {
  const res = await fetch(url, { cache: "no-store" });
  // SAFETY: Graph API always responds with either { error } or { data, paging };
  // the shape is checked immediately below (body.error / !res.ok) before use.
  const body = (await res.json()) as GraphListBody<T>;

  if (!res.ok || body.error) {
    throw new Error(`Meta API error: ${body.error?.message ?? res.statusText}`);
  }

  return body;
}

// Sigue la paginación de Graph API hasta traer todos los resultados. Para
// cuentas grandes esto puede ser muchas páginas — aceptable en Nivel 1
// (sincronización manual/ocasional, no de alta frecuencia).
async function listAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
  let url: string | undefined = buildUrl(path, params);
  const results: T[] = [];

  while (url) {
    const body: GraphListBody<T> = await fetchGraph<T>(url);
    results.push(...body.data);
    url = body.paging?.next;
  }

  return results;
}

export function listCampaigns(adAccountId: string): Promise<MetaCampaign[]> {
  return listAll<MetaCampaign>(`/act_${adAccountId}/campaigns`, {
    fields: "id,name,objective,status",
    limit: "100",
  });
}

export function listAdSets(adAccountId: string): Promise<MetaAdSet[]> {
  return listAll<MetaAdSet>(`/act_${adAccountId}/adsets`, {
    fields: "id,name,campaign_id,status",
    limit: "100",
  });
}

export function listAds(adAccountId: string): Promise<MetaAd[]> {
  return listAll<MetaAd>(`/act_${adAccountId}/ads`, {
    fields: "id,name,adset_id,status",
    limit: "100",
  });
}

// Insights a nivel anuncio para un día (por defecto "ayer" — Meta suele
// tener datos de "hoy" incompletos/inestables hasta que el día cierra).
export function listAdInsights(adAccountId: string, datePreset = "yesterday"): Promise<MetaInsight[]> {
  return listAll<MetaInsight>(`/act_${adAccountId}/insights`, {
    level: "ad",
    fields: "campaign_id,adset_id,ad_id,spend,impressions,clicks,actions,date_start",
    date_preset: datePreset,
    limit: "500",
  });
}
