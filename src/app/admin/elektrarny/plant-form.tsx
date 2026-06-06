"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { Plant } from "@/lib/database.types";

import { savePlant } from "./actions";
import { initialPlantSaveState } from "./types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

export function PlantForm({ plant }: { plant: Plant | null }) {
  const [state, action, pending] = useActionState(savePlant, initialPlantSaveState);
  const router = useRouter();

  // Po vytvoření nové elektrárny přejdeme na editaci (kde se spravují invertory).
  useEffect(() => {
    if (state.status === "success" && state.plantId) {
      router.push(`/admin/elektrarny/${state.plantId}/upravit`);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5">
      {plant && <input type="hidden" name="id" value={plant.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="owner_first_name" className={labelClass}>Jméno majitele</label>
          <input id="owner_first_name" name="owner_first_name" type="text" required
            defaultValue={plant?.owner_first_name ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="owner_last_name" className={labelClass}>Příjmení majitele</label>
          <input id="owner_last_name" name="owner_last_name" type="text" required
            defaultValue={plant?.owner_last_name ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="owner_email" className={labelClass}>E-mail</label>
          <input id="owner_email" name="owner_email" type="email"
            defaultValue={plant?.owner_email ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="owner_phone" className={labelClass}>Telefon</label>
          <input id="owner_phone" name="owner_phone" type="tel"
            defaultValue={plant?.owner_phone ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>Adresa instalace</label>
        <input id="address" name="address" type="text"
          defaultValue={plant?.address ?? ""} className={inputClass} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="gps_lat" className={labelClass}>GPS šířka</label>
          <input id="gps_lat" name="gps_lat" type="text" inputMode="decimal" placeholder="49.1951"
            defaultValue={plant?.gps_lat ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="gps_lng" className={labelClass}>GPS délka</label>
          <input id="gps_lng" name="gps_lng" type="text" inputMode="decimal" placeholder="16.6068"
            defaultValue={plant?.gps_lng ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="reserved_power_kw" className={labelClass}>Rezerv. příkon (kW)</label>
          <input id="reserved_power_kw" name="reserved_power_kw" type="text" inputMode="decimal"
            defaultValue={plant?.reserved_power_kw ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="sm:max-w-xs">
        <label htmlFor="subscription_until" className={labelClass}>
          Předplatné do <span className="text-zinc-400">(volitelné)</span>
        </label>
        <input
          id="subscription_until"
          name="subscription_until"
          type="date"
          defaultValue={plant?.subscription_until ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="is_active" defaultChecked={plant?.is_active ?? true}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20" />
        Aktivní monitoring
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
          {pending ? "Ukládám…" : plant ? "Uložit změny" : "Vytvořit elektrárnu"}
        </button>
        {state.status !== "idle" && (
          <span className={`text-sm ${state.status === "success" ? "text-green-700" : "text-red-700"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
