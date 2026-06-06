// Server Component — no "use client"

export type TrackerRow = {
  n: number;
  vdc: number | null;
  idc: number | null;
  power: number | null; // null when inactive (vdc=0 or idc=0)
  pctOfInvAvg: number | null;
  pctOfPlantAvg: number | null;
};

export type InverterCard = {
  id: string;
  label: string | null;
  wifi_sn: string;
  recorded_at: string | null;
  inverter_status: string | null;
  trackers: TrackerRow[];
  hasAnomaly: boolean;
};

type Props = {
  inverters: InverterCard[];
  hasMultipleInverters: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  "0": "Čekání",
  "1": "Kontrola",
  "3": "Normální provoz",
  "4": "Porucha",
  "5": "Trvalá porucha",
  "6": "Aktualizace",
  "7": "Kontrola EPS",
  "8": "EPS provoz",
  "9": "Vlastní test",
  "10": "Nečinný",
  "11": "Pohotovost",
  "97": "Export Control",
  "98": "Nabíjení",
  "99": "AC nabíjení",
};

function statusBadgeClass(status: string): string {
  if (["4", "5"].includes(status))
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  if (["3", "97", "98", "99"].includes(status))
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
}

function DeviationBadge({ pct }: { pct: number }) {
  const diff = pct - 100;
  const text = diff >= 0 ? `+${diff} %` : `${diff} %`;
  const cls =
    pct >= 80
      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
      : pct >= 60
        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

export function MpptStatus({ inverters, hasMultipleInverters }: Props) {
  if (!inverters.length) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Stav MPPT trackerů
      </h2>

      <div className="space-y-5">
        {inverters.map((inv) => (
          <div
            key={inv.id}
            className={`rounded-lg border p-4 ${
              inv.hasAnomaly
                ? "border-red-300 dark:border-red-800"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {/* Card header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {inv.hasAnomaly && (
                  <span className="text-base text-red-500" aria-label="Anomálie">
                    ⚠
                  </span>
                )}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {inv.label ?? inv.wifi_sn}
                </span>
                {inv.inverter_status && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(inv.inverter_status)}`}
                  >
                    {STATUS_LABELS[inv.inverter_status] ?? `Stav ${inv.inverter_status}`}
                  </span>
                )}
              </div>
              {inv.recorded_at ? (
                <p className="text-xs text-zinc-400">
                  {new Date(inv.recorded_at).toLocaleString("cs-CZ", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ) : (
                <p className="text-xs text-zinc-400">Žádná nedávná data</p>
              )}
            </div>

            {/* Tracker table */}
            {inv.trackers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                    <tr>
                      <th className="pb-2.5 pr-4 font-medium">Tracker</th>
                      <th className="pb-2.5 pr-4 font-medium">Výkon (W)</th>
                      <th className="pb-2.5 pr-4 font-medium">Napětí (V)</th>
                      <th className="pb-2.5 pr-4 font-medium">Proud (A)</th>
                      <th className="pb-2.5 pr-4 font-medium">vs střídač</th>
                      {hasMultipleInverters && (
                        <th className="pb-2.5 font-medium">vs elektrárna</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {inv.trackers.map((t) => (
                      <tr key={t.n}>
                        <td className="py-3 pr-4 font-medium text-zinc-700 dark:text-zinc-300">
                          MPPT {t.n}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-zinc-900 dark:text-zinc-50">
                          {t.power != null ? t.power.toFixed(1) : "—"}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-zinc-500">
                          {t.vdc != null && t.vdc > 0 ? t.vdc : "—"}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-zinc-500">
                          {t.idc != null && t.idc > 0 ? t.idc : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {t.pctOfInvAvg != null ? (
                            <DeviationBadge pct={t.pctOfInvAvg} />
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        {hasMultipleInverters && (
                          <td className="py-3">
                            {t.pctOfPlantAvg != null ? (
                              <DeviationBadge pct={t.pctOfPlantAvg} />
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Žádná nedávná data pro tento střídač.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
