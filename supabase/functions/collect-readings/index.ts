import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Solax: max 10 req/min → 6.5s throttle
const SOLAX_THROTTLE_MS = 6500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

// ---- SOLAX helpers ----------------------------------------------------------

async function fetchSolaxReading(baseUrl: string, token: string, wifiSn: string): Promise<AnyObj | null> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/v2/dataAccess/realtimeInfo/get`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", tokenId: token },
    body: JSON.stringify({ wifiSn }),
  });
  if (!res.ok) return null;
  const data = await res.json() as AnyObj;
  if (!data.success || !data.result) return null;
  return data.result;
}

function mapSolaxReading(r: AnyObj, inverterId: string) {
  let recorded_at: string;
  try { recorded_at = new Date(r.uploadTime).toISOString(); }
  catch { recorded_at = new Date().toISOString(); }

  return {
    inverter_id: inverterId,
    recorded_at,
    vdc1: r.vdc1 ?? null, vdc2: r.vdc2 ?? null, vdc3: r.vdc3 ?? null, vdc4: r.vdc4 ?? null,
    idc1: r.idc1 ?? null, idc2: r.idc2 ?? null, idc3: r.idc3 ?? null, idc4: r.idc4 ?? null,
    vac1: r.vac1 ?? null, vac2: r.vac2 ?? null, vac3: r.vac3 ?? null,
    soc: r.soc ?? null,
    battemper: r.battemper ?? null,
    acpower: r.acpower ?? null,
    yieldtoday: r.yieldtoday ?? null,
    inverter_status: r.inverterStatus != null ? String(r.inverterStatus) : null,
    feedinpower: r.feedinpower ?? null,
    powerdc1: r.powerdc1 ?? null, powerdc2: r.powerdc2 ?? null,
    powerdc3: r.powerdc3 ?? null, powerdc4: r.powerdc4 ?? null,
    batpower: r.batPower ?? null,
    ratedpower: r.ratedPower ?? null,
    temperature: r.temperature ?? null,
  };
}

// ---- GOODWE helpers ---------------------------------------------------------

async function goodweLogin(username: string, password: string): Promise<{ token: string; uid: string; timestamp: string; apiBase: string } | null> {
  const res = await fetch("https://www.semsportal.com/api/v3/Common/CrossLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "token": JSON.stringify({ version: "3.1.1", client: "ios", language: "en" }),
    },
    body: JSON.stringify({ account: username, pwd: password }),
  });
  const data = await res.json() as AnyObj;
  const d = data?.data;
  if (!d?.token) return null;
  const api = String(data?.api ?? "https://eu.semsportal.com/api");
  return {
    token: d.token,
    uid: d.uid,
    timestamp: String(d.timestamp),
    apiBase: api.endsWith("/") ? api : `${api}/`,
  };
}

async function fetchGoodWeStation(auth: { token: string; uid: string; timestamp: string }, powerStationId: string): Promise<AnyObj | null> {
  const url = "https://www.semsportal.com/api/v3/PowerStation/GetMonitorDetailByPowerstationId";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "token": JSON.stringify({ version: "3.1.1", client: "ios", language: "en", ...auth }),
    },
    body: JSON.stringify({ powerStationId }),
  });
  if (!res.ok) return null;
  const data = await res.json() as AnyObj;
  if (data.code !== "0" && data.code !== 0) return null;
  return data?.data ?? null;
}

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const num = Number(v);
  return isNaN(num) ? null : num;
}

function pdc(v: unknown, i: unknown): number | null {
  const vn = n(v);
  const iin = n(i);
  if (vn === null || iin === null) return null;
  return Math.round(vn * iin);
}

// inv = celý objekt invertoru z GoodWe API (inv.d = přímá data, inv.invert_full = kompletní data)
function mapGoodWeInverter(inv: AnyObj, inverterId: string): AnyObj {
  const d = inv.d ?? {};
  const full = inv.invert_full ?? {};

  // Parsuj last_refresh_time z formátu "dd.MM.yyyy HH:mm:ss"
  let recorded_at: string;
  try {
    const [datePart, timePart] = (d.last_refresh_time ?? "").split(" ");
    const [day, month, year] = datePart.split(".");
    recorded_at = new Date(`${year}-${month}-${day}T${timePart}`).toISOString();
  } catch {
    recorded_at = new Date().toISOString();
  }

  // SOC: v d objektu je jako string "99%", v invert_full jako číslo
  const socRaw = full.soc ?? d.soc;
  const soc = typeof socRaw === "string"
    ? n(parseFloat(socRaw))
    : n(socRaw);

  // feedinpower: pmeter je v invert_full, záporné = export → obrátíme znaménko
  const pmeter = full.pmeter ?? null;
  const feedinpower = pmeter != null ? -(Number(pmeter)) : null;

  // batpower: battery_power na vnějším objektu nebo total_pbattery v invert_full
  const batpower = n(inv.battery_power ?? full.total_pbattery ?? null);

  // BMS teplota baterie
  const battemper = n(full.more_batterys?.[0]?.bms_temperature ?? null);

  return {
    inverter_id: inverterId,
    recorded_at,
    vdc1: n(d.vpv1), vdc2: n(d.vpv2), vdc3: n(d.vpv3), vdc4: n(d.vpv4),
    idc1: n(d.ipv1), idc2: n(d.ipv2), idc3: n(d.ipv3), idc4: n(d.ipv4),
    vac1: n(d.vac1), vac2: n(d.vac2), vac3: n(d.vac3),
    soc,
    battemper,
    acpower: n(d.pac),
    yieldtoday: n(d.eDay),
    inverter_status: d.work_mode ?? null,
    feedinpower: isNaN(feedinpower as number) ? null : feedinpower,
    // GoodWe: powerdc = vpv * ipv
    powerdc1: pdc(d.vpv1, d.ipv1),
    powerdc2: pdc(d.vpv2, d.ipv2),
    powerdc3: pdc(d.vpv3, d.ipv3),
    powerdc4: pdc(d.vpv4, d.ipv4),
    batpower,
    ratedpower: n(d.capacity ? parseFloat(d.capacity) * 1000 : null),
    temperature: n(inv.tempperature ?? null), // GoodWe: překlep v API (tempperature)
  };
}

// ---- Hlavní handler ---------------------------------------------------------

Deno.serve(async (_req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  // Načti aktivní invertory s external_id
  const { data: inverters, error: invErr } = await supabase
    .from("inverters")
    .select("id, wifi_sn, brand, external_id, plant_id, plants!inner(is_active)")
    .eq("is_active", true)
    .eq("plants.is_active", true);

  if (invErr) return new Response(JSON.stringify({ error: invErr.message }), { status: 500 });
  if (!inverters?.length) return new Response(JSON.stringify({ message: "Žádné aktivní invertory." }), { status: 200 });

  // Načti API konfigurace
  const { data: configs } = await supabase
    .from("api_configs")
    .select("brand, url, token, username, password, sems_token, sems_uid, sems_token_expires_at")
    .eq("is_active", true);

  const configMap: Record<string, AnyObj> = {};
  for (const c of configs ?? []) configMap[c.brand.toLowerCase()] = c;

  const results = { success: 0, skipped: 0, failed: 0 };
  const errors: string[] = [];
  const log = (msg: string) => { console.error(msg); errors.push(msg); };

  // ---- Solax invertory -------------------------------------------------------
  const solaxInverters = inverters.filter(i => i.brand.toLowerCase() === "solax");
  const solaxCfg = configMap["solax"];

  for (let i = 0; i < solaxInverters.length; i++) {
    const inv = solaxInverters[i];
    if (!solaxCfg?.token) { results.skipped++; log(`Solax ${inv.wifi_sn}: chybí token`); continue; }
    if (i > 0) await sleep(SOLAX_THROTTLE_MS);

    try {
      const r = await fetchSolaxReading(solaxCfg.url, solaxCfg.token, inv.wifi_sn);
      if (!r) { results.skipped++; log(`Solax ${inv.wifi_sn}: API vrátilo null`); continue; }
      const row = mapSolaxReading(r, inv.id);
      const { error } = await supabase.from("inverter_readings")
        .upsert(row, { onConflict: "inverter_id,recorded_at", ignoreDuplicates: true });
      if (error) { log(`Solax insert ${inv.wifi_sn}: ${error.message}`); results.failed++; }
      else results.success++;
    } catch (err) {
      log(`Solax ${inv.wifi_sn}: ${err}`);
      results.failed++;
    }
  }

  // ---- GoodWe invertory ------------------------------------------------------
  const goodweInverters = inverters.filter(i => i.brand.toLowerCase() === "goodwe");
  const goodweCfg = configMap["goodwe"];

  if (goodweInverters.length > 0 && goodweCfg) {
    const auth = await goodweLogin(goodweCfg.username, goodweCfg.password);
    if (!auth) {
      log(`GoodWe CrossLogin selhal (user: ${goodweCfg.username})`);
      results.failed += goodweInverters.length;
    } else {
      const byStation = new Map<string, typeof goodweInverters>();
      for (const inv of goodweInverters) {
        const psId = inv.external_id ?? "";
        if (!psId) { results.skipped++; log(`GoodWe ${inv.wifi_sn}: chybí external_id`); continue; }
        if (!byStation.has(psId)) byStation.set(psId, []);
        byStation.get(psId)!.push(inv);
      }

      for (const [powerStationId, stationInverters] of byStation) {
        try {
          const stationData = await fetchGoodWeStation(auth, powerStationId);
          if (!stationData) {
            log(`GoodWe station ${powerStationId}: API vrátilo null`);
            results.failed += stationInverters.length;
            continue;
          }

          const apiInverterMap = new Map<string, AnyObj>();
          for (const apiInv of stationData.inverter ?? []) {
            apiInverterMap.set(apiInv.sn, apiInv);
          }

          for (const inv of stationInverters) {
            const apiInv = apiInverterMap.get(inv.wifi_sn);
            if (!apiInv?.d) { results.skipped++; log(`GoodWe ${inv.wifi_sn}: nenalezen v API (sn nesedí nebo chybí d)`); continue; }
            const row = mapGoodWeInverter(apiInv, inv.id);
            const { error } = await supabase.from("inverter_readings")
              .upsert(row, { onConflict: "inverter_id,recorded_at", ignoreDuplicates: true });
            if (error) { log(`GoodWe insert ${inv.wifi_sn}: ${error.message}`); results.failed++; }
            else results.success++;
          }
        } catch (err) {
          log(`GoodWe station ${powerStationId}: ${err}`);
          results.failed += stationInverters.length;
        }
      }
    }
  } else if (goodweInverters.length > 0 && !goodweCfg) {
    log("GoodWe: chybí konfigurace v api_configs");
    results.failed += goodweInverters.length;
  }

  return new Response(
    JSON.stringify({ ...results, total: inverters.length, ...(errors.length ? { errors } : {}) }),
    { headers: { "Content-Type": "application/json" } },
  );
});
