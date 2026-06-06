"use client";

import { useActionState, useEffect, useState } from "react";

import type { Inverter } from "@/lib/database.types";

import { addInverter, deleteInverter, updateInverter } from "../../actions";
import { initialInverterState } from "../../types";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";
const BRANDS = ["Solax", "GoodWe"];

// ---- Řádek existujícího invertoru -------------------------------------------

function InverterRow({ inv, plantId }: { inv: Inverter; plantId: string }) {
  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState(inv.brand);
  const [saveState, saveAction, savePending] = useActionState(updateInverter, initialInverterState);
  const [delState, delAction, delPending] = useActionState(deleteInverter, initialInverterState);

  useEffect(() => {
    if (saveState.status === "success") setEditing(false);
  }, [saveState.status]);

  if (editing) {
    return (
      <li className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <form action={saveAction} className="space-y-4">
          <input type="hidden" name="id" value={inv.id} />
          <input type="hidden" name="plant_id" value={plantId} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>
                {brand === "GoodWe" ? "Sériové číslo (SN)" : "WiFi SN"}
              </label>
              <input
                name="wifi_sn"
                type="text"
                required
                defaultValue={inv.wifi_sn}
                placeholder={brand === "GoodWe" ? "9010KETU21BW4058" : "SUT****VB1"}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Značka</label>
              <select name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Název</label>
              <input
                name="label"
                type="text"
                defaultValue={inv.label ?? ""}
                placeholder="Střecha jih"
                className={inputClass}
              />
            </div>
          </div>
          {brand === "GoodWe" && (
            <div>
              <label className={labelClass}>
                PowerStation ID{" "}
                <span className="text-zinc-400 font-normal">(z URL portálu semsportal.com)</span>
              </label>
              <input
                name="external_id"
                type="text"
                defaultValue={inv.external_id ?? ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={inputClass}
              />
            </div>
          )}
          {brand !== "GoodWe" && (
            <input type="hidden" name="external_id" value="" />
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={inv.is_active}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20"
            />
            Aktivní
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savePending}
              className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {savePending ? "Ukládám…" : "Uložit"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Zrušit
            </button>
            {saveState.status === "error" && (
              <span className="text-sm text-red-700">{saveState.message}</span>
            )}
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {inv.label ?? inv.wifi_sn}
        </p>
        <p className="text-xs text-zinc-500">
          {inv.label ? `${inv.wifi_sn} · ` : ""}{inv.brand}
          {inv.external_id && <span className="ml-1 text-zinc-400">· PS: {inv.external_id.slice(0, 8)}…</span>}
          {" · "}
          <span className={inv.is_active ? "text-green-600" : "text-zinc-400"}>
            {inv.is_active ? "Aktivní" : "Neaktivní"}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex h-8 items-center rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Upravit
        </button>
        <form action={delAction}>
          <input type="hidden" name="id" value={inv.id} />
          <input type="hidden" name="plant_id" value={plantId} />
          <button
            type="submit"
            disabled={delPending}
            className="inline-flex h-8 items-center rounded-md border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            {delPending ? "Mažu…" : "Smazat"}
          </button>
        </form>
        {delState.status === "error" && (
          <span className="text-xs text-red-700">{delState.message}</span>
        )}
      </div>
    </li>
  );
}

// ---- Formulář pro přidání invertoru -----------------------------------------

function AddInverterForm({ plantId }: { plantId: string }) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("Solax");
  const [state, action, pending] = useActionState(addInverter, initialInverterState);

  useEffect(() => {
    if (state.status === "success") { setOpen(false); setBrand("Solax"); }
  }, [state.status]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-4 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
      >
        + Přidat invertor
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Nový invertor</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="plant_id" value={plantId} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>
              {brand === "GoodWe" ? "Sériové číslo (SN) *" : "WiFi SN *"}
            </label>
            <input
              name="wifi_sn"
              type="text"
              required
              placeholder={brand === "GoodWe" ? "9010KETU21BW4058" : "SUT****VB1"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Značka</label>
            <select name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Název</label>
            <input
              name="label"
              type="text"
              placeholder="Střecha jih"
              className={inputClass}
            />
          </div>
        </div>
        {brand === "GoodWe" && (
          <div>
            <label className={labelClass}>
              PowerStation ID{" "}
              <span className="text-zinc-400 font-normal">(z URL portálu semsportal.com)</span>
            </label>
            <input
              name="external_id"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Najdeš ho v URL: semsportal.com/PowerStation/PowerStatusSnMin/<strong>{"{ID}"}</strong>
            </p>
          </div>
        )}
        {brand !== "GoodWe" && (
          <input type="hidden" name="external_id" value="" />
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {pending ? "Přidávám…" : "Přidat invertor"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Zrušit
          </button>
          {state.status === "error" && (
            <span className="text-sm text-red-700">{state.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}

// ---- Hlavní export ----------------------------------------------------------

export function InverterSection({
  inverters,
  plantId,
}: {
  inverters: Inverter[];
  plantId: string;
}) {
  return (
    <div className="space-y-3">
      {inverters.length === 0 ? (
        <p className="text-sm text-zinc-500">Zatím žádné invertory.</p>
      ) : (
        <ul className="space-y-2">
          {inverters.map((inv) => (
            <InverterRow key={inv.id} inv={inv} plantId={plantId} />
          ))}
        </ul>
      )}
      <AddInverterForm plantId={plantId} />
    </div>
  );
}
