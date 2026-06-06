"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { fetchSolaxRealtime } from "@/lib/solax";

import type { SaveState, TestState, GoodWeTestResult } from "./types";

// Prázdný základ pro TestState — zjednodušuje return statements
const EMPTY_TEST = {
  result: null,
  goodweResult: null,
  rawResponse: null,
} satisfies Pick<TestState, "result" | "goodweResult" | "rawResponse">;

// ---- Uložení konfigurace ----------------------------------------------------

export async function saveConfig(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const brand = String(formData.get("brand") ?? "").trim();
  if (!brand) return { status: "error", message: "Vyberte značku." };

  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("api_configs")
    .select("id")
    .eq("brand", brand)
    .maybeSingle();

  if (selectError) return { status: "error", message: `Chyba DB: ${selectError.message}` };

  // ---- GoodWe ----
  if (brand === "GoodWe") {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const testWifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

    if (!username) return { status: "error", message: "Vyplňte přihlašovací email." };
    if (!existing && !password) return { status: "error", message: "Vyplňte heslo." };

    const base = {
      brand,
      url: "https://www.semsportal.com",
      token: "",
      username,
      test_wifi_sn: testWifiSn || null,
    };

    const { error: writeError } = existing
      ? await supabase
          .from("api_configs")
          .update({
            ...base,
            ...(password ? { password } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      : await supabase.from("api_configs").insert({ ...base, password: password || null });

    if (writeError) return { status: "error", message: `Uložení selhalo: ${writeError.message}` };

    revalidatePath("/admin/konfigurace");
    return { status: "success", message: "Konfigurace GoodWe byla uložena." };
  }

  // ---- Solax (stávající logika) ----
  const url = String(formData.get("url") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const testWifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

  if (!url || !token) return { status: "error", message: "Vyplňte API URL a token." };

  const payload = { brand, url, token, test_wifi_sn: testWifiSn || null };

  const { error: writeError } = existing
    ? await supabase
        .from("api_configs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("api_configs").insert(payload);

  if (writeError) return { status: "error", message: `Uložení selhalo: ${writeError.message}` };

  revalidatePath("/admin/konfigurace");
  return { status: "success", message: "Konfigurace Solax byla uložena." };
}

// ---- Test připojení ---------------------------------------------------------

export async function testConnection(
  _prevState: TestState,
  formData: FormData,
): Promise<TestState> {
  const brand = String(formData.get("brand") ?? "").trim();

  // ---- GoodWe ----
  if (brand === "GoodWe") {
    const username = String(formData.get("username") ?? "").trim();
    let password = String(formData.get("password") ?? "").trim();
    const powerStationId = String(formData.get("test_wifi_sn") ?? "").trim();

    // Pokud je heslo prázdné, načti uložené z DB
    if (!password) {
      const supabase = await createClient();
      const { data: saved } = await supabase
        .from("api_configs")
        .select("password")
        .eq("brand", "GoodWe")
        .maybeSingle();
      password = saved?.password ?? "";
    }

    if (!username || !password)
      return { ...EMPTY_TEST, status: "error", message: "Pro test vyplňte email a heslo." };
    if (!powerStationId)
      return { ...EMPTY_TEST, status: "error", message: "Pro test vyplňte PowerStation ID." };

    // Krok 1: CrossLogin (v3 endpoint, token verze 3.1.1)
    // Zdroj: TimSoethout/goodwe-sems-home-assistant sems_api.py
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let crossData: Record<string, any>;
    try {
      const res = await fetch("https://www.semsportal.com/api/v3/Common/CrossLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "token": JSON.stringify({ version: "3.1.1", client: "ios", language: "en" }),
        },
        body: JSON.stringify({ account: username, pwd: password }),
        cache: "no-store",
      });
      crossData = await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "síťová chyba";
      return { ...EMPTY_TEST, status: "error", message: `CrossLogin selhal: ${msg}` };
    }

    const authData = crossData?.data;
    if (!authData?.token) {
      const msg = String(crossData?.msg || "Přihlášení se nezdařilo.");
      return { ...EMPTY_TEST, status: "error", message: msg, rawResponse: crossData };
    }

    const { uid, timestamp, token: semsToken } = authData as {
      uid: string; timestamp: string; token: string;
    };
    // API URL je na vrchní úrovni response
    const api = String(crossData?.api ?? "https://eu.semsportal.com/api");
    const apiBase = api.endsWith("/") ? api : `${api}/`;

    // Krok 2: GetMonitorDetailByPowerstationId (v3 endpoint, JSON body)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let monitorData: Record<string, any>;
    // EU server nemá PowerStation endpoint → zkus hlavní portal
    const monitorUrl = `https://www.semsportal.com/api/v3/PowerStation/GetMonitorDetailByPowerstationId`;
    try {
      const res = await fetch(monitorUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "token": JSON.stringify({
            version: "3.1.1", client: "ios", language: "en",
            timestamp: String(timestamp), uid, token: semsToken,
          }),
        },
        body: JSON.stringify({ powerStationId }),
        cache: "no-store",
      });
      const text = await res.text();
      try {
        monitorData = JSON.parse(text);
      } catch {
        // Vrátilo HTML nebo jiný non-JSON obsah
        return {
          ...EMPTY_TEST,
          status: "error",
          message: `GetMonitorDetail vrátilo neplatnou odpověď (HTTP ${res.status}). URL: ${monitorUrl}`,
          rawResponse: { url: monitorUrl, status: res.status, body: text.slice(0, 300) },
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "síťová chyba";
      return { ...EMPTY_TEST, status: "error", message: `GetMonitorDetail selhal: ${msg}`, rawResponse: crossData };
    }

    const stationData = monitorData?.data;
    if (!stationData) {
      const msg = String(monitorData?.msg || "Nepodařilo se načíst data elektrárny.");
      return { ...EMPTY_TEST, status: "error", message: msg, rawResponse: monitorData };
    }

    // Ulož SEMS tokeny do DB
    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("api_configs")
      .update({
        sems_token: semsToken,
        sems_uid: uid,
        sems_api_url: String(api),
        sems_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("brand", "GoodWe");

    // Extrahuj zobrazovaná data
    const info = stationData.info ?? {};
    const kpi = stationData.kpi ?? {};
    const goodweResult: GoodWeTestResult = {
      stationName: typeof info.stationname === "string" ? info.stationname : null,
      power: typeof kpi.power === "number" ? kpi.power : null,
      capacity: typeof info.capacity === "number" ? info.capacity : null,
      status: typeof info.status === "number" ? info.status : null,
    };

    return {
      ...EMPTY_TEST,
      status: "success",
      message: "Připojení k GoodWe SEMS proběhlo úspěšně.",
      goodweResult,
      rawResponse: monitorData,
    };
  }

  // ---- Solax (stávající logika) ----
  const url = String(formData.get("url") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const wifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

  if (!url || !token)
    return { ...EMPTY_TEST, status: "error", message: "Pro test vyplňte API URL a token." };
  if (!wifiSn)
    return { ...EMPTY_TEST, status: "error", message: "Pro test vyplňte WiFi SN." };

  const { ok, message, result, rawResponse } = await fetchSolaxRealtime(url, token, wifiSn);
  return { ...EMPTY_TEST, status: ok ? "success" : "error", message, result, rawResponse };
}
