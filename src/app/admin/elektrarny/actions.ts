"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { InverterState, PlantSaveState } from "./types";

// Prázdné pole → null; jinak číslo. Vrací undefined při neplatném vstupu (necháme DB default/null).
function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ---- Elektrárna -------------------------------------------------------------

export async function savePlant(
  _prevState: PlantSaveState,
  formData: FormData,
): Promise<PlantSaveState> {
  const id = str(formData, "id");
  const ownerFirstName = str(formData, "owner_first_name");
  const ownerLastName = str(formData, "owner_last_name");

  if (!ownerFirstName || !ownerLastName) {
    return { status: "error", message: "Vyplňte jméno a příjmení majitele." };
  }

  const payload = {
    owner_first_name: ownerFirstName,
    owner_last_name: ownerLastName,
    owner_email: str(formData, "owner_email") || null,
    owner_phone: str(formData, "owner_phone") || null,
    address: str(formData, "address") || null,
    gps_lat: num(formData, "gps_lat"),
    gps_lng: num(formData, "gps_lng"),
    reserved_power_w: num(formData, "reserved_power_w"),
    subscription_until: str(formData, "subscription_until") || null,
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("plants")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { status: "error", message: `Uložení selhalo: ${error.message}` };

    revalidatePath("/admin/elektrarny");
    revalidatePath(`/admin/elektrarny/${id}`);
    return { status: "success", message: "Elektrárna byla uložena." };
  }

  const { data, error } = await supabase
    .from("plants")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { status: "error", message: `Vytvoření selhalo: ${error.message}` };

  revalidatePath("/admin/elektrarny");
  return { status: "success", message: "Elektrárna byla vytvořena.", plantId: data.id };
}

// ---- Invertory --------------------------------------------------------------

function revalidatePlant(plantId: string) {
  revalidatePath(`/admin/elektrarny/${plantId}`);
  revalidatePath(`/admin/elektrarny/${plantId}/upravit`);
}

export async function addInverter(
  _prevState: InverterState,
  formData: FormData,
): Promise<InverterState> {
  const plantId = str(formData, "plant_id");
  const wifiSn = str(formData, "wifi_sn");
  const brand = str(formData, "brand");

  if (!plantId) return { status: "error", message: "Chybí ID elektrárny." };
  if (!wifiSn || !brand) return { status: "error", message: "Vyplňte WiFi SN a značku." };

  const supabase = await createClient();
  const { error } = await supabase.from("inverters").insert({
    plant_id: plantId,
    wifi_sn: wifiSn,
    brand,
    label: str(formData, "label") || null,
  });
  if (error) return { status: "error", message: `Přidání selhalo: ${error.message}` };

  revalidatePlant(plantId);
  return { status: "success", message: "Invertor byl přidán." };
}

export async function updateInverter(
  _prevState: InverterState,
  formData: FormData,
): Promise<InverterState> {
  const id = str(formData, "id");
  const plantId = str(formData, "plant_id");
  const wifiSn = str(formData, "wifi_sn");
  const brand = str(formData, "brand");

  if (!id) return { status: "error", message: "Chybí ID invertoru." };
  if (!wifiSn || !brand) return { status: "error", message: "Vyplňte WiFi SN a značku." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inverters")
    .update({
      wifi_sn: wifiSn,
      brand,
      label: str(formData, "label") || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);
  if (error) return { status: "error", message: `Uložení selhalo: ${error.message}` };

  if (plantId) revalidatePlant(plantId);
  return { status: "success", message: "Invertor byl uložen." };
}

export async function deleteInverter(
  _prevState: InverterState,
  formData: FormData,
): Promise<InverterState> {
  const id = str(formData, "id");
  const plantId = str(formData, "plant_id");

  if (!id) return { status: "error", message: "Chybí ID invertoru." };

  const supabase = await createClient();
  const { error } = await supabase.from("inverters").delete().eq("id", id);
  if (error) return { status: "error", message: `Smazání selhalo: ${error.message}` };

  if (plantId) revalidatePlant(plantId);
  return { status: "success", message: "Invertor byl smazán." };
}
