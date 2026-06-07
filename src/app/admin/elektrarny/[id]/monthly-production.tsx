"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyRow = {
  inverter_id: string;
  month: string; // ISO timestamp — vždy 1. den měsíce UTC
  monthly_kwh: number;
};

type InverterMeta = { id: string; label: string | null };

type Props = {
  inverters: InverterMeta[];
  data: MonthlyRow[];
};

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function isCurrentMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getUTCMonth() === now.getUTCMonth() && d.getUTCFullYear() === now.getUTCFullYear();
}

type TooltipPayload = { dataKey?: string; name?: string; value?: number; fill?: string };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => (p.value ?? 0) > 0);
  const total = items.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1.5 font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
      {items.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {(p.value ?? 0).toFixed(1)} kWh
        </p>
      ))}
      {items.length > 1 && (
        <p className="mt-1.5 border-t border-zinc-200 pt-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
          Celkem: {total.toFixed(1)} kWh
        </p>
      )}
    </div>
  );
}

export function MonthlyProduction({ inverters, data }: Props) {
  // Unikátní měsíce sestupně
  const months = [...new Set(data.map((d) => d.month))].sort((a, b) =>
    b.localeCompare(a),
  );

  // Tabulková data: všechny měsíce DESC
  const tableRows = months.map((month) => {
    const values: Record<string, number> = {};
    let total = 0;
    for (const inv of inverters) {
      const row = data.find((d) => d.inverter_id === inv.id && d.month === month);
      const val = row ? row.monthly_kwh : 0;
      values[inv.id] = val;
      total += val;
    }
    return { month, values, total };
  });

  // Graf: posledních 12 měsíců ASC (přirozené pořadí na ose X)
  const chartMonths = months.slice(0, 12).reverse();
  const chartData = chartMonths.map((month) => {
    const obj: Record<string, string | number> = { month: formatMonth(month) };
    for (const inv of inverters) {
      const row = data.find((d) => d.inverter_id === inv.id && d.month === month);
      obj[inv.id] = row ? row.monthly_kwh : 0;
    }
    return obj;
  });

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Měsíční výroba
      </h2>

      {!data.length ? (
        <p className="text-sm text-zinc-500">Zatím žádná data o výrobě.</p>
      ) : (
        <>
          {/* Sloupcový graf */}
          <div className="mb-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}`}
                  unit=" kWh"
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {inverters.map((inv, i) => (
                  <Bar
                    key={inv.id}
                    dataKey={inv.id}
                    name={inv.label ?? `Střídač ${i + 1}`}
                    stackId="a"
                    fill={COLORS[i % COLORS.length]}
                    radius={i === inverters.length - 1 ? [3, 3, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabulka */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <th className="pb-2 pr-6 font-medium">Měsíc</th>
                  {inverters.map((inv, i) => (
                    <th key={inv.id} className="pb-2 pr-6 font-medium">
                      <span style={{ color: COLORS[i % COLORS.length] }}>■</span>{" "}
                      {inv.label ?? `Střídač ${i + 1}`}
                    </th>
                  ))}
                  <th className="pb-2 font-medium">Celkem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {tableRows.map(({ month, values, total }) => {
                  const current = isCurrentMonth(month);
                  const cls = current
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400";
                  return (
                    <tr key={month}>
                      <td className={`py-2 pr-6 ${cls}`}>{formatMonth(month)}</td>
                      {inverters.map((inv) => (
                        <td key={inv.id} className={`py-2 pr-6 tabular-nums ${cls}`}>
                          {values[inv.id] > 0 ? `${values[inv.id].toFixed(1)}` : "—"}
                        </td>
                      ))}
                      <td className={`py-2 tabular-nums ${cls}`}>
                        {total > 0 ? `${total.toFixed(1)} kWh` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
