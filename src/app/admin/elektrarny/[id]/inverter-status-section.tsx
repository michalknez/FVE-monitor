"use client";

import { inverterStatusLabel, inverterStatusSeverity } from "@/lib/solax";

// ---------------------------------------------------------------------------
// Public data type (filled by server, passed as props)
// ---------------------------------------------------------------------------

export type InverterStatusData = {
  id: string;
  label: string | null;
  wifi_sn: string;
  recorded_at: string | null;
  inverter_status: string | null;
  pv_total: number | null;
  acpower: number | null;
  house_consumption: number | null;
  feedinpower: number | null; // signed: + = export, − = import
  batpower: number | null;    // signed: + = charging, − = discharging
  soc: number | null;
  rated_power: number | null;
  reserved_power_w: number | null;
};

// ---------------------------------------------------------------------------
// SVG gauge helpers
// ---------------------------------------------------------------------------

const CX = 100, CY = 100, R = 78, SW = 12;

function pt(angleDeg: number, r = R): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

const [lx, ly] = pt(180); // left  (22, 100)
const [rx, ry] = pt(0);   // right (178, 100)
// Full semicircle: clockwise from left to right over the top (sweep=1, large-arc=1)
const BG_ARC = `M ${lx} ${ly} A ${R} ${R} 0 1 1 ${rx} ${ry}`;

function buildValueArc(pct: number): string | null {
  if (pct <= 0) return null;
  if (pct >= 1) return BG_ARC;
  const [ex, ey] = pt(180 + pct * 180); // clockwise from 180°
  return `M ${lx} ${ly} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
}

// ---------------------------------------------------------------------------
// GaugeArc
// ---------------------------------------------------------------------------

function GaugeArc({
  value,
  min = 0,
  max,
  color,
  label,
  unit,
  showZeroMark = false,
}: {
  value: number | null;
  min?: number;
  max: number | null;
  color: string;
  label: string;
  unit: string;
  showZeroMark?: boolean;
}) {
  const safeMax = max ?? 0;
  const range = safeMax - min;
  const pct = value !== null && range > 0
    ? Math.max(0, Math.min(1, (value - min) / range))
    : 0;

  const arc = value !== null && range > 0 ? buildValueArc(pct) : null;

  // Zero-mark at top of arc (270° in our system = pct 0.5)
  const [zix, ziy] = pt(270, R - SW / 2 - 2);
  const [zox, zoy] = pt(270, R + SW / 2 + 2);

  const displayVal = value !== null
    ? unit === "%" ? value.toFixed(1) : String(Math.round(value))
    : "—";

  return (
    <svg viewBox="0 0 200 125" className="w-full select-none" aria-label={`${label}: ${displayVal} ${unit}`}>
      {/* Background arc */}
      <path
        d={BG_ARC}
        fill="none"
        strokeWidth={SW}
        strokeLinecap="round"
        className="stroke-zinc-200 dark:stroke-zinc-700"
      />

      {/* Value arc */}
      {arc && (
        <path
          d={arc}
          fill="none"
          strokeWidth={SW}
          strokeLinecap="round"
          style={{ stroke: color }}
        />
      )}

      {/* Zero mark for bidirectional gauges */}
      {showZeroMark && (
        <line
          x1={zix} y1={ziy}
          x2={zox} y2={zoy}
          strokeWidth={2.5}
          strokeLinecap="round"
          className="stroke-zinc-400 dark:stroke-zinc-500"
        />
      )}

      {/* Value */}
      <text
        x={CX} y={84}
        textAnchor="middle"
        fontSize={24}
        fontWeight={700}
        className="fill-zinc-900 dark:fill-zinc-50"
      >
        {displayVal}
      </text>
      <text
        x={CX} y={99}
        textAnchor="middle"
        fontSize={12}
        className="fill-zinc-500 dark:fill-zinc-400"
      >
        {unit}
      </text>

      {/* Label */}
      <text
        x={CX} y={118}
        textAnchor="middle"
        fontSize={11}
        className="fill-zinc-400 dark:fill-zinc-500"
      >
        {label}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------

const SEVERITY_COLORS = {
  ok:    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  warn:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  info:  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
} as const;

// ---------------------------------------------------------------------------
// InverterCard
// ---------------------------------------------------------------------------

function InverterCard({ inv }: { inv: InverterStatusData }) {
  const rp = inv.rated_power;
  const reservedW = inv.reserved_power_w;

  // Grid gauge: absolute value, color/label by sign
  const gridAbsValue = inv.feedinpower !== null ? Math.abs(inv.feedinpower) : null;
  const gridIsImport = inv.feedinpower !== null && inv.feedinpower < 0;
  const gridColor = gridIsImport ? "#ef4444" : "#a855f7";
  const gridLabel = gridIsImport ? "Odběr ze sítě" : "Přetok do sítě";

  // Battery: bidirectional, color by sign
  const batIsCharging = inv.batpower === null || inv.batpower >= 0;
  const batColor = batIsCharging ? "#22c55e" : "#ef4444";

  const gauges: Array<{
    value: number | null;
    min?: number;
    max: number | null;
    color: string;
    label: string;
    unit: string;
    showZeroMark?: boolean;
  }> = [
    // Row 1
    { value: inv.pv_total,          min: 0, max: rp,        color: "#eab308", label: "FV výkon",      unit: "W" },
    { value: inv.acpower,           min: 0, max: rp,        color: "#3b82f6", label: "AC výkon",       unit: "W" },
    { value: inv.house_consumption, min: 0, max: rp,        color: "#f97316", label: "Spotřeba domu",  unit: "W" },
    // Row 2
    { value: gridAbsValue,          min: 0, max: reservedW, color: gridColor, label: gridLabel,         unit: "W" },
    {
      value: inv.batpower,
      min: rp !== null ? -rp : 0,
      max: rp,
      color: batColor,
      label: "Baterie",
      unit: "W",
      showZeroMark: true,
    },
    { value: inv.soc, min: 0, max: 100, color: "#22c55e", label: "SOC baterie", unit: "%" },
  ];

  const severity = inverterStatusSeverity(inv.inverter_status);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {inv.label ?? inv.wifi_sn}
        </span>
        {inv.recorded_at ? (
          <span className="text-xs text-zinc-400">
            {new Date(inv.recorded_at).toLocaleString("cs-CZ", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Žádná data</span>
        )}
      </div>

      {inv.recorded_at === null ? (
        <p className="text-sm text-zinc-400">Žádná nedávná data pro tento střídač.</p>
      ) : (
        <>
          {/* Gauges grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
            {gauges.map((g, i) => (
              <GaugeArc key={i} {...g} />
            ))}
          </div>

          {/* Status badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-400">Stav:</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[severity]}`}>
              {inverterStatusLabel(inv.inverter_status)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported section component
// ---------------------------------------------------------------------------

export function InverterStatusSection({ inverters }: { inverters: InverterStatusData[] }) {
  if (!inverters.length) return null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Aktuální stav střídačů
      </h2>
      <div className="space-y-5">
        {inverters.map((inv) => (
          <InverterCard key={inv.id} inv={inv} />
        ))}
      </div>
    </section>
  );
}
