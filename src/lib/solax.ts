// Sdílená logika pro Solax Cloud API: typ realtime odpovědi, mapy stavových kódů
// a fetch helper. Používá ji jak test připojení (konfigurace), tak detail elektrárny.
//
// fetchSolaxRealtime je určen jen pro server (token nesmí do klienta) — importují
// ho pouze server actions / server components. Mapy a typ jsou bezpečné i pro klienta
// (sdílený panel je client component).

// Tvar realtime odpovědi Solax Cloud API (jen pole, která zpracováváme).
export type SolaxRealtime = {
  // Identifikace
  inverterSn: string | null;
  sn: string | null;
  ratedPower: number | null;
  inverterType: string | null;
  inverterStatus: string | null;
  uploadTime: string | null;
  timeZone: string | null;
  // AC výstup
  acpower: number | null;
  vac1: number | null; vac2: number | null; vac3: number | null;
  iac1: number | null; iac2: number | null; iac3: number | null;
  pac1: number | null; pac2: number | null; pac3: number | null;
  fac1: number | null; fac2: number | null; fac3: number | null;
  // DC vstup (MPPT)
  vdc1: number | null; vdc2: number | null; vdc3: number | null; vdc4: number | null;
  idc1: number | null; idc2: number | null; idc3: number | null; idc4: number | null;
  powerdc1: number | null; powerdc2: number | null; powerdc3: number | null; powerdc4: number | null;
  // Energie
  yieldtoday: number | null;
  yieldtotal: number | null;
  pvenergy: number | null;
  feedinpower: number | null;
  feedinenergy: number | null;
  consumeenergy: number | null;
  acenergyin: number | null;
  feedinpowerM2: number | null;
  feedinenergyM2: number | null;
  consumeenergyM2: number | null;
  // Baterie
  soc: number | null;
  batVoltage: number | null;
  batCurrent: number | null;
  batPower: number | null;
  battemper: number | null;
  batStatus: string | null;
  batcycle: string | null;
  chargeEnergy: number | null;
  dischargeEnergy: number | null;
  surplusEnergy: number | null;
  // Teploty
  temperature: number | null;
  temperBoard: number | null;
  // EPS
  veps1: number | null; veps2: number | null; veps3: number | null;
  ieps1: number | null; ieps2: number | null; ieps3: number | null;
  peps1: number | null; peps2: number | null; peps3: number | null;
  epsfreq: number | null;
};

// Mapování kódu stavu invertoru na český popis.
export const INVERTER_STATUS: Record<string, string> = {
  "100": "Čeká na spuštění", "101": "Autotest", "102": "Normální provoz",
  "103": "Obnovitelná porucha", "104": "Trvalá porucha", "105": "Aktualizace firmware",
  "106": "Detekce EPS", "107": "Mimo síť (off-grid)", "108": "Testovací režim (IT)",
  "109": "Režim spánku", "110": "Pohotovostní režim", "111": "FV probuzení baterie",
  "112": "Detekce generátoru", "113": "Generátorový režim", "114": "Rychlé vypnutí",
  "130": "VPP režim", "131": "TOU – vlastní spotřeba", "132": "TOU – nabíjení", "133": "TOU – vybíjení",
};

export const BAT_STATUS: Record<string, string> = {
  "0": "Normální", "1": "Porucha", "2": "Odpojeno",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function n(v: any): number | null {
  return v != null && v !== "" ? Number(v) : null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function s(v: any): string | null {
  return v != null && v !== "" ? String(v) : null;
}

export type SolaxResult = {
  ok: boolean;
  message: string;
  result: SolaxRealtime | null;
};

/**
 * Zavolá Solax Cloud realtime API pro daný WiFi SN. UI-agnostické: vrací
 * { ok, message, result }. Nikdy nehází — chyby vrací jako ok:false.
 * POUZE pro server (token nesmí opustit server).
 */
export async function fetchSolaxRealtime(
  url: string,
  token: string,
  wifiSn: string,
): Promise<SolaxResult> {
  // URL z konfigurace už obvykle obsahuje schéma; doplníme ho, kdyby chybělo,
  // a ořízneme koncové lomítko.
  const base = (/^https?:\/\//i.test(url) ? url : `https://${url}`).replace(/\/+$/, "");

  try {
    const response = await fetch(`${base}/api/v2/dataAccess/realtimeInfo/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json", tokenId: token },
      body: JSON.stringify({ wifiSn }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, message: `API odpovědělo chybou HTTP ${response.status}.`, result: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any;

    if (!data.success || !data.result) {
      return { ok: false, message: data.exception?.trim() || "API vrátilo neúspěšnou odpověď.", result: null };
    }

    const r = data.result;
    const result: SolaxRealtime = {
      inverterSn: s(r.inverterSn), sn: s(r.sn), ratedPower: n(r.ratedPower),
      inverterType: s(r.inverterType), inverterStatus: s(r.inverterStatus),
      uploadTime: s(r.uploadTime), timeZone: s(r.timeZone),
      acpower: n(r.acpower),
      vac1: n(r.vac1), vac2: n(r.vac2), vac3: n(r.vac3),
      iac1: n(r.iac1), iac2: n(r.iac2), iac3: n(r.iac3),
      pac1: n(r.pac1), pac2: n(r.pac2), pac3: n(r.pac3),
      fac1: n(r.fac1), fac2: n(r.fac2), fac3: n(r.fac3),
      vdc1: n(r.vdc1), vdc2: n(r.vdc2), vdc3: n(r.vdc3), vdc4: n(r.vdc4),
      idc1: n(r.idc1), idc2: n(r.idc2), idc3: n(r.idc3), idc4: n(r.idc4),
      powerdc1: n(r.powerdc1), powerdc2: n(r.powerdc2), powerdc3: n(r.powerdc3), powerdc4: n(r.powerdc4),
      yieldtoday: n(r.yieldtoday), yieldtotal: n(r.yieldtotal), pvenergy: n(r.pvenergy),
      feedinpower: n(r.feedinpower), feedinenergy: n(r.feedinenergy),
      consumeenergy: n(r.consumeenergy), acenergyin: n(r.acenergyin),
      feedinpowerM2: n(r.feedinpowerM2), feedinenergyM2: n(r.feedinenergyM2), consumeenergyM2: n(r.consumeenergyM2),
      soc: n(r.soc), batVoltage: n(r.batVoltage), batCurrent: n(r.batCurrent), batPower: n(r.batPower),
      battemper: n(r.battemper), batStatus: s(r.batStatus), batcycle: s(r.batcycle),
      chargeEnergy: n(r.chargeEnergy), dischargeEnergy: n(r.dischargeEnergy), surplusEnergy: n(r.surplusEnergy),
      temperature: n(r.temperature), temperBoard: n(r.temperBoard),
      veps1: n(r.veps1), veps2: n(r.veps2), veps3: n(r.veps3),
      ieps1: n(r.ieps1), ieps2: n(r.ieps2), ieps3: n(r.ieps3),
      peps1: n(r.peps1), peps2: n(r.peps2), peps3: n(r.peps3),
      epsfreq: n(r.epsfreq),
    };

    return { ok: true, message: data.exception?.trim() || "Připojení proběhlo úspěšně.", result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neznámá chyba sítě.";
    return { ok: false, message: `Připojení selhalo: ${message}`, result: null };
  }
}
