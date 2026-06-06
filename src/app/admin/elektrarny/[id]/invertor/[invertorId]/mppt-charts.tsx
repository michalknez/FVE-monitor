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
  /** Percentage of tracker-group average: 100 = at average, 83 = 17 % below */
  pctOfAvg: number;
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

export function MpptCharts({ trackers, avgPower, trendData, inverterComparison }: Props) {
  const barData = trackers.map((t) => ({
    name: `MPPT ${t.n}`,
    power: t.power,
    pctOfAvg: t.pctOfAvg,
  }));

  return (
    <>
      {/* MPPT tracker comparison */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Srovnání MPPT trackerů
        </h2>

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

        <div className="mt-6 space-y-2">
          {trackers.map((t) => (
            <div
              key={t.n}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-100 px-4 py-3 text-sm dark:border-zinc-800"
            >
              <span className="w-16 font-medium text-zinc-700 dark:text-zinc-300">
                MPPT {t.n}
              </span>
              <span className="w-20 tabular-nums text-zinc-900 dark:text-zinc-50">
                {t.power} W
              </span>
              <span className="w-20 tabular-nums text-zinc-500">{t.vdc} V</span>
              <span className="w-16 tabular-nums text-zinc-500">{t.idc} A</span>
              <span className="ml-auto">
                <DeviationBadge pct={t.pctOfAvg} />
              </span>
            </div>
          ))}
          <p className="pt-1 text-xs text-zinc-400">Průměr trackerů: {avgPower} W</p>
        </div>
      </section>

      {/* 7-day deviation trend */}
      {trendData.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Trend odchylek — posledních 7 dní
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                unit=" %"
                tick={{ fontSize: 11 }}
                width={48}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(v, name) => [`${v} %`, String(name)]}
                labelFormatter={(l) => String(l)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#71717a" strokeDasharray="4 2" />
              <Line
                type="monotone"
                dataKey="t1"
                stroke={TRACKER_COLORS[0]}
                dot={false}
                strokeWidth={2}
                name="MPPT 1"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="t2"
                stroke={TRACKER_COLORS[1]}
                dot={false}
                strokeWidth={2}
                name="MPPT 2"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="t3"
                stroke={TRACKER_COLORS[2]}
                dot={false}
                strokeWidth={2}
                name="MPPT 3"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="t4"
                stroke={TRACKER_COLORS[3]}
                dot={false}
                strokeWidth={2}
                name="MPPT 4"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Cross-inverter comparison */}
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
