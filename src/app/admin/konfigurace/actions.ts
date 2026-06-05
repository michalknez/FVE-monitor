"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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

  // Jeden záznam na značku: pokud existuje, aktualizujeme ho, jinak vložíme nový.
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
  const payload = {
    brand,
    url,
    token,
    test_wifi_sn: testWifiSn || null,
  };

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

// Tvar odpovědi Solax Cloud API (jen pole, která zobrazujeme).
type SolaxResponse = {
  success: boolean;
  exception?: string;
  result?: {
    acpower?: number;
    inverterStatus?: number | string;
    yieldtoday?: number;
    uploadTime?: string;
  } | null;
};

export async function testConnection(
  _prevState: TestState,
  formData: FormData,
): Promise<TestState> {
  const url = String(formData.get("url") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const wifiSn = String(formData.get("test_wifi_sn") ?? "").trim();

  if (!url || !token) {
    return {
      status: "error",
      message: "Pro test vyplňte API URL a token.",
      result: null,
    };
  }
  if (!wifiSn) {
    return {
      status: "error",
      message: "Pro test vyplňte WiFi SN.",
      result: null,
    };
  }

  // URL z formuláře už obvykle obsahuje schéma (default https://global.solaxcloud.com),
  // proto schéma nepřidáváme znovu — jen ho doplníme, kdyby chybělo.
  const base = (/^https?:\/\//i.test(url) ? url : `https://${url}`).replace(
    /\/+$/,
    "",
  );
  const endpoint = `${base}/api/v2/dataAccess/realtimeInfo/get`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        tokenId: token,
      },
      body: JSON.stringify({ wifiSn }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: "error",
        message: `API odpovědělo chybou HTTP ${response.status}.`,
        result: null,
      };
    }

    const data = (await response.json()) as SolaxResponse;

    if (!data.success || !data.result) {
      return {
        status: "error",
        message: data.exception?.trim() || "API vrátilo neúspěšnou odpověď.",
        result: null,
      };
    }

    return {
      status: "success",
      message: data.exception?.trim() || "Připojení proběhlo úspěšně.",
      result: {
        acpower: data.result.acpower ?? null,
        inverterStatus: data.result.inverterStatus ?? null,
        yieldtoday: data.result.yieldtoday ?? null,
        uploadTime: data.result.uploadTime ?? null,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Neznámá chyba sítě.";
    return {
      status: "error",
      message: `Připojení selhalo: ${message}`,
      result: null,
    };
  }
}
