"use client";

import { useActionState } from "react";
import type { ApiConfig } from "@/lib/database.types";
import { SolaxRealtimePanel } from "@/components/solax-realtime-panel";
import { saveConfig, testConnection } from "./actions";
import { initialSaveState, initialTestState } from "./types";

const DEFAULT_SOLAX_URL = "https://global.solaxcloud.com";

const BRANDS = [
  { value: "Solax", label: "Solax", disabled: false },
  { value: "GoodWe", label: "GoodWe (brzy)", disabled: true },
];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

export function ConfigForm({ config }: { config: ApiConfig | null }) {
  const [saveState, saveAction, savePending] = useActionState(saveConfig, initialSaveState);
  const [testState, testAction, testPending] = useActionState(testConnection, initialTestState);

  return (
    <form className="space-y-5">
      <div>
        <label htmlFor="brand" className={labelClass}>Značka</label>
        <select id="brand" name="brand" defaultValue={config?.brand ?? "Solax"} className={inputClass}>
          {BRANDS.map((b) => (
            <option key={b.value} value={b.value} disabled={b.disabled}>{b.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>API URL</label>
        <input id="url" name="url" type="url" defaultValue={config?.url ?? DEFAULT_SOLAX_URL}
          placeholder={DEFAULT_SOLAX_URL} className={inputClass} />
      </div>

      <div>
        <label htmlFor="token" className={labelClass}>Token</label>
        <input id="token" name="token" type="password" defaultValue={config?.token ?? ""}
          autoComplete="off" placeholder="tokenId pro Solax Cloud API" className={inputClass} />
      </div>

      <div>
        <label htmlFor="test_wifi_sn" className={labelClass}>
          WiFi SN <span className="text-zinc-400">(pro testování)</span>
        </label>
        <input id="test_wifi_sn" name="test_wifi_sn" type="text"
          defaultValue={config?.test_wifi_sn ?? ""} placeholder="Sériové číslo WiFi dongle" className={inputClass} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" formAction={saveAction} disabled={savePending || testPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
          {savePending ? "Ukládám…" : "Uložit"}
        </button>
        <button type="submit" formAction={testAction} disabled={savePending || testPending}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50">
          {testPending ? "Testuji…" : "Otestovat připojení"}
        </button>
      </div>

      {saveState.status !== "idle" && (
        <p className={`rounded-md px-3 py-2 text-sm ${saveState.status === "success"
          ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {saveState.message}
        </p>
      )}

      {testState.status !== "idle" && (
        <div className={`rounded-md border px-4 py-3 text-sm ${testState.status === "success"
          ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-medium ${testState.status === "success" ? "text-green-700" : "text-red-700"}`}>
            {testState.status === "success" ? "✓ Připojení v pořádku" : "✕ Test selhal"}
          </p>
          <p className="mt-1 text-zinc-600">{testState.message}</p>
          {testState.result && <SolaxRealtimePanel r={testState.result} />}
          {testState.rawResponse && (
            <details className="mt-4 border-t border-zinc-200 pt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600">
                Raw odpověď API
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-900 p-4 text-xs text-green-400">
                {JSON.stringify(testState.rawResponse, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </form>
  );
}
