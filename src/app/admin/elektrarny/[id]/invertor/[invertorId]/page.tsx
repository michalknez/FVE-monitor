import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { inverterStatusLabel, inverterStatusSeverity } from "@/lib/solax";
import { MpptCharts } from "./mppt-charts";
import type { TrackerData, TrendPoint, InverterBar } from "./mppt-charts";

// ---------------------------------------------------------------------------
// Local types for this route's queries
// ---------------------------------------------------------------------------

type LastReading = {
  id: string;
  inverter_id: string;
  recorded_at: string;
  soc: number | null;
  battemper: number | null;
  temperature: number | null;
  acpower: number | null;
  yieldtoday: number | null;
  inverter_status: string | null;
  vdc1: number | null; vdc2: number | null; vdc3: number | null; vdc4: number | null;
  idc1: number | null; idc2: number | null; idc3: number | null; idc4: number | null;
  vac1: number | null; vac2: number | null; vac3: number | null;
};

type Reading7d = {
  recorded_at: string;
  vdc1: number | null; vdc2: number | null; vdc3: number | null; vdc4: number | null;
  idc1: number | null; idc2: number | null; idc3: number | null; idc4: number | null;
};

type CrossReading = Reading7d & { inverter_id: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPower(vdc: number | null, idc: number | null): number | null {
  if (vdc == null || idc == null || vdc === 0 || idc === 0) return null;
  return Math.round(vdc * idc);
}

const SEVERITY_CLASS: Record<string, string> = {
  ok:    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  warn:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  info:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value != null ? `${value} ${unit}` : "—"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const metadata: Metadata = { title: "Detail střídače | FVE Monitor" };

export default async function InverterDetailPage({
  params,
}: {
  params: Promise<{ id: string; invertorId: string }>;
}) {
  const { id: plantId, invertorId } = await params;
  const supabase = await createClient();

  // Round 1 — inverter identity, plant name, sibling inverters
  const [
    { data: inverter, error: invErr },
    { data: plant },
    { data: allInverters },
  ] = await Promise.all([
    supabase.from("inverters").select("*").eq("id", invertorId).single(),
    supabase
      .from("plants")
      .select("id, owner_first_name, owner_last_name")
      .eq("id", plantId)
      .single(),
    supabase
      .from("inverters")
      .select("id, label, wifi_sn")
      .eq("plant_id", plantId)
      .eq("is_active", true),
  ]);

  if (invErr || !inverter || !plant) notFound();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Ensure current inverter is in the cross-query even if inactive
  const crossIds = [...new Set([...(allInverters ?? []).map((i) => i.id), invertorId])];

  // Round 2 — readings
  const [{ data: lastArr }, { data: readings7d }, { data: recentAll }] =
    await Promise.all([
      supabase
        .from("inverter_readings")
        .select(
          "id, inverter_id, recorded_at, soc, battemper, temperature, acpower, yieldtoday, inverter_status, vdc1, vdc2, vdc3, vdc4, idc1, idc2, idc3, idc4, vac1, vac2, vac3",
        )
        .eq("inverter_id", invertorId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .returns<LastReading[]>(),
      supabase
        .from("inverter_readings")
        .select("recorded_at, vdc1, vdc2, vdc3, vdc4, idc1, idc2, idc3, idc4")
        .eq("inverter_id", invertorId)
        .gte("recorded_at", sevenDaysAgo)
        .order("recorded_at")
        .returns<Reading7d[]>(),
      supabase
        .from("inverter_readings")
        .select("inverter_id, recorded_at, vdc1, vdc2, vdc3, vdc4, idc1, idc2, idc3, idc4")
        .in("inverter_id", crossIds)
        .gte("recorded_at", twoHoursAgo)
        .order("recorded_at", { ascending: false })
        .returns<CrossReading[]>(),
    ]);

  const last = lastArr?.[0] ?? null;

  // ---------------------------------------------------------------------------
  // Latest reading per inverter — needed for plant-wide average
  // ---------------------------------------------------------------------------

  const latestPerInv = new Map<string, CrossReading>();
  for (const r of recentAll ?? []) {
    if (!latestPerInv.has(r.inverter_id)) latestPerInv.set(r.inverter_id, r);
  }

  // Plant-wide average tracker power (all active trackers across all inverters)
  let plantTotalPower = 0;
  let plantTotalCount = 0;
  for (const r of latestPerInv.values()) {
    const powers = [
      calcPower(r.vdc1, r.idc1),
      calcPower(r.vdc2, r.idc2),
      calcPower(r.vdc3, r.idc3),
      calcPower(r.vdc4, r.idc4),
    ].filter((p): p is number => p !== null);
    plantTotalPower += powers.reduce((a, b) => a + b, 0);
    plantTotalCount += powers.length;
  }

  // ---------------------------------------------------------------------------
  // MPPT tracker analysis (current measurement)
  // ---------------------------------------------------------------------------

  const rawTrackers = last
    ? [
        { n: 1, vdc: last.vdc1, idc: last.idc1 },
        { n: 2, vdc: last.vdc2, idc: last.idc2 },
        { n: 3, vdc: last.vdc3, idc: last.idc3 },
        { n: 4, vdc: last.vdc4, idc: last.idc4 },
      ]
    : [];

  const activeTrackers = rawTrackers
    .map((t) => ({ ...t, power: calcPower(t.vdc, t.idc) }))
    .filter((t): t is typeof t & { power: number } => t.power !== null);

  const avgPower =
    activeTrackers.length > 0
      ? activeTrackers.reduce((s, t) => s + t.power, 0) / activeTrackers.length
      : 0;

  const plantAvgPower = plantTotalCount > 0 ? plantTotalPower / plantTotalCount : avgPower;

  const trackers: TrackerData[] = activeTrackers.map((t) => ({
    n: t.n,
    power: t.power,
    vdc: t.vdc ?? 0,
    idc: t.idc ?? 0,
    pctOfAvg: avgPower > 0 ? Math.round((t.power / avgPower) * 100) : 100,
    pctOfPlantAvg: plantAvgPower > 0 ? Math.round((t.power / plantAvgPower) * 100) : 100,
  }));

  const anomalies = trackers.filter((t) => t.pctOfAvg < 60);

  // ---------------------------------------------------------------------------
  // 7-day deviation trend
  // ---------------------------------------------------------------------------

  const dailyDevs = new Map<string, { [n: number]: number[] }>();

  for (const r of readings7d ?? []) {
    const date = r.recorded_at.slice(0, 10);
    const powers = [
      calcPower(r.vdc1, r.idc1),
      calcPower(r.vdc2, r.idc2),
      calcPower(r.vdc3, r.idc3),
      calcPower(r.vdc4, r.idc4),
    ];
    const active = powers.filter((p): p is number => p !== null && p > 0);
    if (active.length === 0) continue;
    const mean = active.reduce((a, b) => a + b, 0) / active.length;
    if (mean === 0) continue;

    if (!dailyDevs.has(date)) dailyDevs.set(date, { 1: [], 2: [], 3: [], 4: [] });
    const day = dailyDevs.get(date)!;
    powers.forEach((p, i) => {
      if (p !== null && p > 0)
        day[i + 1].push(Math.round(((p / mean) - 1) * 100));
    });
  }

  const dayAvg = (arr: number[]): number | null =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const trendData: TrendPoint[] = Array.from(dailyDevs.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, t]) => ({
      date,
      t1: dayAvg(t[1]),
      t2: dayAvg(t[2]),
      t3: dayAvg(t[3]),
      t4: dayAvg(t[4]),
    }));

  // ---------------------------------------------------------------------------
  // Cross-inverter comparison bar chart data
  // ---------------------------------------------------------------------------

  const plantHasMultipleInverters = (allInverters?.length ?? 0) > 1;

  const inverterComparison: InverterBar[] = plantHasMultipleInverters
    ? (allInverters ?? []).map((inv) => {
        const r = latestPerInv.get(inv.id);
        const powers = r
          ? ([
              calcPower(r.vdc1, r.idc1),
              calcPower(r.vdc2, r.idc2),
              calcPower(r.vdc3, r.idc3),
              calcPower(r.vdc4, r.idc4),
            ].filter((p): p is number => p !== null))
          : [];
        return {
          id: inv.id,
          label: inv.label ?? inv.wifi_sn,
          power: powers.length > 0 ? powers.reduce((a, b) => a + b, 0) : null,
          isCurrent: inv.id === invertorId,
        };
      })
    : [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const invertorLabel = inverter.label ?? inverter.wifi_sn;
  const statusLabel = last?.inverter_status ? inverterStatusLabel(last.inverter_status) : null;
  const statusSeverity = last?.inverter_status ? inverterStatusSeverity(last.inverter_status) : "info";

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/admin/elektrarny"
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Elektrárny
          </Link>
          <span aria-hidden>→</span>
          <Link
            href={`/admin/elektrarny/${plantId}`}
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {plant.owner_first_name} {plant.owner_last_name}
          </Link>
          <span aria-hidden>→</span>
          <span className="text-zinc-900 dark:text-zinc-50">{invertorLabel}</span>
        </nav>

        {/* Anomaly banner */}
        {anomalies.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950">
            {anomalies.map((a) => (
              <p key={a.n} className="text-sm font-medium text-red-700 dark:text-red-300">
                Detekována anomálie: MPPT {a.n} vykazuje snížený výkon ({a.pctOfAvg}&nbsp;%
                průměru)
              </p>
            ))}
          </div>
        )}

        {/* Live data */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {invertorLabel}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-zinc-400">{inverter.wifi_sn}</p>
            </div>
            {last && (
              <p className="shrink-0 text-xs text-zinc-400">
                Poslední měření:{" "}
                {new Date(last.recorded_at).toLocaleString("cs-CZ", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {!last ? (
            <p className="text-sm text-zinc-400">Zatím žádná data.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="AC výkon" value={last.acpower} unit="W" />
                <StatCard label="SOC baterie" value={last.soc} unit="%" />
                <StatCard label="Teplota baterie" value={last.battemper} unit="°C" />
                <StatCard label="Teplota střídače" value={last.temperature} unit="°C" />
              </div>

              {statusLabel && (
                <div className="mt-4">
                  <p className="mb-1 text-xs text-zinc-500">Stav střídače</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_CLASS[statusSeverity]}`}>
                    {statusLabel}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {/* MPPT + trend + cross-inverter charts (client) */}
        {trackers.length > 0 && (
          <MpptCharts
            trackers={trackers}
            avgPower={Math.round(avgPower)}
            trendData={trendData}
            inverterComparison={inverterComparison}
            plantHasMultipleInverters={plantHasMultipleInverters}
          />
        )}
      </main>
    </div>
  );
}
