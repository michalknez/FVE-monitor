import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Solax: max 10 req/min → čekáme 6.5s mezi voláními pro jistotu
const THROTTLE_MS = 6500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (_req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  // 1. Načti všechny aktivní invertory + jejich brand
  const { data: inverters, error: invErr } = await supabase
    .from("inverters")
    .select("id, wifi_sn, brand, plant_id, plants!inner(is_active)")
    .eq("is_active", true)
    .eq("plants.is_active", true);

  if (invErr) {
    return new Response(JSON.stringify({ error: invErr.message }), { status: 500 });
  }
  if (!inverters || inverters.length === 0) {
    return new Response(JSON.stringify({ message: "Žádné aktivní invertory." }), { status: 200 });
  }

  // 2. Načti API konfigurace (per brand)
  const { data: configs } = await supabase
    .from("api_configs")
    .select("brand, url, token")
    .eq("is_active", true);

  const configMap: Record<string, { url: string; token: string }> = {};
  for (const c of configs ?? []) {
    configMap[c.brand.toLowerCase()] = { url: c.url, token: c.token };
  }

  // 3. Pro každý invertor zavolej API a ulož výsledek
  const results = { success: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < inverters.length; i++) {
    const inv = inverters[i];
    const cfg = configMap[inv.brand.toLowerCase()];

    if (!cfg) {
      console.warn(`Chybí API konfigurace pro brand: ${inv.brand}`);
      results.skipped++;
      continue;
    }

    // Throttling — od druhého invertoru čekáme
    if (i > 0) await sleep(THROTTLE_MS);

    try {
      const base = cfg.url.replace(/\/+$/, "");
      const response = await fetch(`${base}/api/v2/dataAccess/realtimeInfo/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json", tokenId: cfg.token },
        body: JSON.stringify({ wifiSn: inv.wifi_sn }),
      });

      if (!response.ok) { results.failed++; continue; }

      // deno-lint-ignore no-explicit-any
      const data = (await response.json()) as any;
      if (!data.success || !data.result) { results.skipped++; continue; }

      const r = data.result;

      // Parsuj uploadTime → timestamptz
      let recorded_at: string;
      try {
        recorded_at = new Date(r.uploadTime).toISOString();
      } catch {
        recorded_at = new Date().toISOString();
      }

      const { error: insertErr } = await supabase.from("inverter_readings").insert({
        inverter_id: inv.id,
        recorded_at,
        vdc1: r.vdc1 ?? null, vdc2: r.vdc2 ?? null, vdc3: r.vdc3 ?? null, vdc4: r.vdc4 ?? null,
        idc1: r.idc1 ?? null, idc2: r.idc2 ?? null, idc3: r.idc3 ?? null, idc4: r.idc4 ?? null,
        vac1: r.vac1 ?? null, vac2: r.vac2 ?? null, vac3: r.vac3 ?? null,
        soc: r.soc ?? null,
        battemper: r.battemper ?? null,
        acpower: r.acpower ?? null,
        yieldtoday: r.yieldtoday ?? null,
        inverter_status: r.inverterStatus != null ? String(r.inverterStatus) : null,
      });

      if (insertErr) { console.error(insertErr.message); results.failed++; }
      else results.success++;

    } catch (err) {
      console.error(`Invertor ${inv.wifi_sn}:`, err);
      results.failed++;
    }
  }

  return new Response(JSON.stringify({ ...results, total: inverters.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
