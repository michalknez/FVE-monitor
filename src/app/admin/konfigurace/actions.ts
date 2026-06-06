"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { fetchSolaxRealtime } from "@/lib/solax";

import type { SaveState, TestState } from "./types";

// ---- Uložení konfigurace ----------------------------------------------------

export async function saveConfig(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const brand = String(formData.get("brand") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const testWifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

  if (!brand || !url || !token) {
    return { status: "error", message: "Vyplňte značku, URL a token." };
  }

  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("api_configs")
    .select("id")
    .eq("brand", brand)
    .maybeSingle();

  if (selectError) {
    return { status: "error", message: `Chyba DB: ${selectError.message}` };
  }

  // is_active se z formuláře nenastavuje: insert ponechá DB default (true),
  // update zachová stávající hodnotu.
  const payload = { brand, url, token, test_wifi_sn: testWifiSn || null };

  const { error: writeError } = existing
    ? await supabase
        .from("api_configs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("api_configs").insert(payload);

  if (writeError) {
    return { status: "error", message: `Uložení selhalo: ${writeError.message}` };
  }

  revalidatePath("/admin/konfigurace");
  return { status: "success", message: "Konfigurace byla uložena." };
}

// ---- Test připojení na Solax API -------------------------------------------

export async function testConnection(
  _prevState: TestState,
  formData: FormData,
): Promise<TestState> {
  const url = String(formData.get("url") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const wifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

  if (!url || !token) return { status: "error", message: "Pro test vyplňte API URL a token.", result: null };
  if (!wifiSn) return { status: "error", message: "Pro test vyplňte WiFi SN.", result: null };

  const { ok, message, result } = await fetchSolaxRealtime(url, token, wifiSn);
  return { status: ok ? "success" : "error", message, result };
}
