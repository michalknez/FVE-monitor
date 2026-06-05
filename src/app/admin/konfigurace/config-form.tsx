"use client";

import { useActionState, useState } from "react";

import type { ApiConfig } from "@/lib/database.types";

import { saveConfig, testConnection } from "./actions";
import { initialSaveState, initialTestState } from "./types";

const DEFAULT_SOLAX_URL = "https://global.solaxcloud.com";

const BRANDS = [
  { value: "Solax", label: "Solax", disabled: false },
  { value: "GoodWe", label: "GoodWe (brzy)", disabled: true },
  { value: "Huawei", label: "Huawei (brzy)", disabled: true },
  { value: "SolarEdge", label: "SolarEdge (brzy)", disabled: true },
];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function ConfigForm({ config }: { config: ApiConfig | null }) {
  const [brand, setBrand] = useState(config?.brand ?? "Solax");
  const [url, setUrl] = useState(config?.url ?? DEFAULT_SOLAX_URL);
  const [token, setToken] = useState(config?.token ?? "");
  const [testWifiSn, setTestWifiSn] = useState(config?.test_wifi_sn ?? "");

  const [saveState, saveAction, savePending] = useActionState(
    saveConfig,
    initialSaveState,
  );
  const [testState, testAction, testPending] = useActionState(
    testConnection,
    initialTestState,
  );

  return (
    <form className="space-y-5">
      <div>
        <label htmlFor="brand" className={labelClass}>
          Značka
        </label>
        <select
          id="brand"
          name="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={inputClass}
        >
          {BRANDS.map((b) => (
            <option key={b.value} value={b.value} disabled={b.disabled}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="url" className={labelClass}>
          API URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={DEFAULT_SOLAX_URL}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="token" className={labelClass}>
          Token
        </label>
        <input
          id="token"
          name="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          placeholder="tokenId pro Solax Cloud API"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="test_wifi_sn" className={labelClass}>
          WiFi SN <span className="text-zinc-400">(pro testování)</span>
        </label>
        <input
          id="test_wifi_sn"
          name="test_wifi_sn"
          type="text"
          value={testWifiSn}
          onChange={(e) => setTestWifiSn(e.target.value)}
          placeholder="Sériové číslo WiFi dongle"
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          formAction={saveAction}
          disabled={savePending || testPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {savePending ? "Ukládám…" : "Uložit"}
        </button>
        <button
          type="submit"
          formAction={testAction}
          disabled={savePending || testPending}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {testPending ? "Testuji…" : "Otestovat připojení"}
        </button>
      </div>

      {saveState.status !== "idle" && (
        <p
          aria-live="polite"
          className={`rounded-md px-3 py-2 text-sm ${
            saveState.status === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {saveState.message}
        </p>
      )}

      {testState.status !== "idle" && (
        <div
          aria-live="polite"
          className={`rounded-md border px-4 py-3 text-sm ${
            testState.status === "success"
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          }`}
        >
          <p
            className={`font-medium ${
              testState.status === "success"
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {testState.status === "success"
              ? "✓ Připojení v pořádku"
              : "✕ Test selhal"}
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {testState.message}
          </p>

          {testState.result && (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-zinc-700 dark:text-zinc-300">
              <dt className="text-zinc-500 dark:text-zinc-400">AC výkon</dt>
              <dd className="font-medium">
                {testState.result.acpower ?? "—"} W
              </dd>

              <dt className="text-zinc-500 dark:text-zinc-400">
                Stav střídače
              </dt>
              <dd className="font-medium">
                {testState.result.inverterStatus ?? "—"}
              </dd>

              <dt className="text-zinc-500 dark:text-zinc-400">
                Dnešní výroba
              </dt>
              <dd className="font-medium">
                {testState.result.yieldtoday ?? "—"} kWh
              </dd>

              <dt className="text-zinc-500 dark:text-zinc-400">
                Čas nahrání
              </dt>
              <dd className="font-medium">
                {testState.result.uploadTime ?? "—"}
              </dd>
            </dl>
          )}
        </div>
      )}
    </form>
  );
}
