"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InverterReading } from "@/lib/database.types";

type InverterData = {
  id: string;
  label: string | null;
  readings: InverterReading[];
};

type Props = {
  inverters: InverterData[];
};

function toHHMM(iso: string) {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasData(readings: InverterReading[], ...keys: (keyof InverterReading)[]) {
  return readings.some((r) => keys.some((k) => r[k] != null));
}

const EmptyChart = () => (
  <div className="flex h-48 items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
    Zatím žádná data pro dnešní den
  </div>
);

function ChartCard({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {title}{" "}
        <span className="text-xs font-normal text-zinc-400">({unit})</span>
      </p>
      {children}
    </div>
  );
}

export function DailyCharts({ inverters }: Props) {
  if (!inverters.length) return null;

  return (
    <div className="space-y-8">
      {inverters.map((inv) => {
        const mul = (a: number | null, b: number | null) =>
          a != null && b != null ? Math.round(a * b) : null;

        const points = inv.readings.map((r) => ({
          time: toHHMM(r.recorded_at),
          soc: r.soc,
          battemper: r.battemper,
          temperature: r.temperature,
          vdc1: r.vdc1,
          vdc2: r.vdc2,
          vdc3: r.vdc3,
          vdc4: r.vdc4,
          idc1: r.idc1,
          idc2: r.idc2,
          idc3: r.idc3,
          idc4: r.idc4,
          pdc1: mul(r.vdc1, r.idc1),
          pdc2: mul(r.vdc2, r.idc2),
          pdc3: mul(r.vdc3, r.idc3),
          pdc4: mul(r.vdc4, r.idc4),
          vac1: r.vac1,
          vac2: r.vac2,
          vac3: r.vac3,
          acpower: r.acpower,
          yieldtoday: r.yieldtoday,
        }));

        return (
          <div key={inv.id}>
            {inverters.length > 1 && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {inv.label ?? inv.id}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <ChartCard title="SOC baterie" unit="%">
                {hasData(inv.readings, "soc") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="%" tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        formatter={(v) => [`${v} %`, "SOC"]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="soc"
                        stroke="#22c55e"
                        dot={false}
                        strokeWidth={2}
                        name="SOC"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="Teplota baterie" unit="°C">
                {hasData(inv.readings, "battemper") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="°C" tick={{ fontSize: 11 }} width={44} />
                      <Tooltip
                        formatter={(v) => [`${v} °C`, "Teplota bat."]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="battemper"
                        stroke="#f97316"
                        dot={false}
                        strokeWidth={2}
                        name="Teplota bat."
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="Teplota střídače" unit="°C">
                {hasData(inv.readings, "temperature") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="°C" tick={{ fontSize: 11 }} width={44} />
                      <Tooltip
                        formatter={(v) => [`${v} °C`, "Teplota stř."]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2}
                        name="Teplota stř."
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="DC napětí MPPT" unit="V">
                {hasData(inv.readings, "vdc1", "vdc2", "vdc3", "vdc4") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="V" tick={{ fontSize: 11 }} width={48} />
                      <Tooltip
                        formatter={(v, name) => [`${v} V`, String(name)]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="vdc1" stroke="#3b82f6" dot={false} strokeWidth={2} name="VDC1" />
                      <Line type="monotone" dataKey="vdc2" stroke="#a855f7" dot={false} strokeWidth={2} name="VDC2" />
                      <Line type="monotone" dataKey="vdc3" stroke="#ec4899" dot={false} strokeWidth={2} name="VDC3" />
                      <Line type="monotone" dataKey="vdc4" stroke="#14b8a6" dot={false} strokeWidth={2} name="VDC4" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="DC proud MPPT" unit="A">
                {hasData(inv.readings, "idc1", "idc2", "idc3", "idc4") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="A" tick={{ fontSize: 11 }} width={44} />
                      <Tooltip
                        formatter={(v, name) => [`${v} A`, String(name)]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="idc1" stroke="#3b82f6" dot={false} strokeWidth={2} name="IDC1" />
                      <Line type="monotone" dataKey="idc2" stroke="#a855f7" dot={false} strokeWidth={2} name="IDC2" />
                      <Line type="monotone" dataKey="idc3" stroke="#ec4899" dot={false} strokeWidth={2} name="IDC3" />
                      <Line type="monotone" dataKey="idc4" stroke="#14b8a6" dot={false} strokeWidth={2} name="IDC4" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="DC výkon MPPT" unit="W">
                {points.some((p) => p.pdc1 != null || p.pdc2 != null || p.pdc3 != null || p.pdc4 != null) ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="W" tick={{ fontSize: 11 }} width={52} />
                      <Tooltip
                        formatter={(v, name) => [`${v} W`, String(name)]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="pdc1" stroke="#3b82f6" dot={false} strokeWidth={2} name="PDC1" />
                      <Line type="monotone" dataKey="pdc2" stroke="#a855f7" dot={false} strokeWidth={2} name="PDC2" />
                      <Line type="monotone" dataKey="pdc3" stroke="#ec4899" dot={false} strokeWidth={2} name="PDC3" />
                      <Line type="monotone" dataKey="pdc4" stroke="#14b8a6" dot={false} strokeWidth={2} name="PDC4" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="Výkon AC" unit="W">
                {hasData(inv.readings, "acpower") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="W" tick={{ fontSize: 11 }} width={52} />
                      <Tooltip
                        formatter={(v) => [`${v} W`, "AC výkon"]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="acpower"
                        stroke="#eab308"
                        dot={false}
                        strokeWidth={2}
                        name="AC výkon"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="Výnos dnes" unit="kWh">
                {hasData(inv.readings, "yieldtoday") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="kWh" tick={{ fontSize: 11 }} width={52} />
                      <Tooltip
                        formatter={(v) => [`${v} kWh`, "Výnos"]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="yieldtoday"
                        stroke="#22c55e"
                        dot={false}
                        strokeWidth={2}
                        name="Výnos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>

              <ChartCard title="Napětí AC fáze" unit="V">
                {hasData(inv.readings, "vac1", "vac2", "vac3") ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis unit="V" tick={{ fontSize: 11 }} width={48} />
                      <Tooltip
                        formatter={(v, name) => [`${v} V`, String(name)]}
                        labelFormatter={(l) => `čas: ${l}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="vac1" stroke="#f59e0b" dot={false} strokeWidth={2} name="L1" />
                      <Line type="monotone" dataKey="vac2" stroke="#10b981" dot={false} strokeWidth={2} name="L2" />
                      <Line type="monotone" dataKey="vac3" stroke="#6366f1" dot={false} strokeWidth={2} name="L3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </ChartCard>
            </div>
          </div>
        );
      })}
    </div>
  );
}
