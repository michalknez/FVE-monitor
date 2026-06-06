"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrackerData = {
  n: number;
  power: number;
  vdc: number;
  idc: number;
  /** % of this inverter's tracker average: 100 = at average, 83 = 17 % below */
  pctOfAvg: number;
  /** % of plant-wide tracker average */
  pctOfPlantAvg: number;
};

export type TrendPoint = {
  date: string;
  /** Deviation from avg in pct-points: 0 = at average, -17 = 17 % below */
  t1: number | null;
  t2: number | null;
  t3: number | null;
  t4: number | null;
};

export type InverterBar = {
  id: string;
  label: string;
  power: number | null;
  isCurrent: boolean;
};

type Props = {
  trackers: TrackerData[];
  avgPower: number;
  trendData: TrendPoint[];
  inverterComparison: InverterBar[];
  plantHasMultipleInverters: boolean;
};

const TRACKER_COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#14b8a6"] as const;

function barFill(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#f97316";
  return "#ef4444";
}

function DeviationBadge({ pct }: { pct: number }) {
  const diff = pct - 100;
  const text = diff >= 0 ? `+${diff} %` : `${diff} %`;
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

export function MpptCharts({
  trackers,
  avgPower,
  trendData,
  inverterComparison,
  plantHasMultipleInverters,
}: Props) {
  const barData = trackers.map((t) => ({
    name: `MPPT ${t.n}`,
    power: t.power,
    pctOfAvg: t.pctOfAvg,
  }));

  return (
    <>
      {/* 1. Tracker table + bar chart */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Srovnání MPPT trackerů
        </h2>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
              <tr>
                <th className="pb-2.5 pr-4 font-medium">Tracker</th>
                <th className="pb-2.5 pr-4 font-medium">Výkon</th>
                <th className="pb-2.5 pr-4 font-medium">Napětí</th>
                <th className="pb-2.5 pr-4 font-medium">Proud</th>
                <th className="pb-2.5 pr-4 font-medium">vs střídač</th>
                {plantHasMultipleInverters && (
                  <th className="pb-2.5 font-medium">vs elektrárna</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {trackers.map((t) => (
                <tr key={t.n}>
                  <td className="py-3 pr-4 font-medium text-zinc-700 dark:text-zinc-300">
                    MPPT {t.n}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-900 dark:text-zinc-50">
                    {t.power} W
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-500">{t.vdc} V</td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-500">{t.idc} A</td>
                  <td className="py-3 pr-4">
                    <DeviationBadge pct={t.pctOfAvg} />
                  </td>
                  {plantHasMultipleInverters && (
                    <td className="py-3">
                      <DeviationBadge pct={t.pctOfPlantAvg} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Průměr trackerů tohoto střídače: {avgPower} W</p>

        {/* Bar chart */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit=" W" tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(v) => [`${v} W`, "Výkon"]}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="power" name="Výkon" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={barFill(entry.pctOfAvg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. 7-day deviation trend */}
      {trendData.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Trend odchylek — posledních 7 dní
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit=" %" tick={{ fontSize: 11 }} width={48} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v, name) => [`${v} %`, String(name)]}
                labelFormatter={(l) => String(l)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#71717a" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="t1" stroke={TRACKER_COLORS[0]} dot={false} strokeWidth={2} name="MPPT 1" connectNulls />
              <Line type="monotone" dataKey="t2" stroke={TRACKER_COLORS[1]} dot={false} strokeWidth={2} name="MPPT 2" connectNulls />
              <Line type="monotone" dataKey="t3" stroke={TRACKER_COLORS[2]} dot={false} strokeWidth={2} name="MPPT 3" connectNulls />
              <Line type="monotone" dataKey="t4" stroke={TRACKER_COLORS[3]} dot={false} strokeWidth={2} name="MPPT 4" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* 3. Cross-inverter comparison */}
      {inverterComparison.length > 1 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Srovnání střídačů elektrárny
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={inverterComparison.map((inv) => ({
                name: inv.label,
                power: inv.power,
                isCurrent: inv.isCurrent,
              }))}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit=" W" tick={{ fontSize: 11 }} width={60} />
              <Tooltip
                formatter={(v) => [`${v} W`, "Výkon"]}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="power" name="Výkon" radius={[4, 4, 0, 0]}>
                {inverterComparison.map((inv, i) => (
                  <Cell key={i} fill={inv.isCurrent ? "#3b82f6" : "#a1a1aa"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </>
  );
}
