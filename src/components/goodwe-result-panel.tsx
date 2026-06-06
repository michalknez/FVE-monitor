import type { GoodWeTestResult } from "@/app/admin/konfigurace/types";

const STATUS_LABELS: Record<number, string> = {
  0: "Offline",
  1: "Online",
  2: "Alarm",
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-zinc-100 text-zinc-700",
  1: "bg-green-100 text-green-800",
  2: "bg-red-100 text-red-800",
};

function val(v: number | string | null, unit = ""): string {
  if (v === null || v === undefined) return "—";
  return `${v}${unit ? " " + unit : ""}`;
}

export function GoodWeResultPanel({ r }: { r: GoodWeTestResult }) {
  const statusLabel =
    r.status !== null ? (STATUS_LABELS[r.status] ?? `Stav ${r.status}`) : "—";
  const statusColor =
    r.status !== null ? (STATUS_COLORS[r.status] ?? "bg-zinc-100 text-zinc-700") : "bg-zinc-100 text-zinc-700";

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Elektrárna GoodWe
      </h4>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <dt className="text-zinc-500">Název</dt>
        <dd className="font-medium text-zinc-800">{val(r.stationName)}</dd>

        <dt className="text-zinc-500">Aktuální výkon</dt>
        <dd className="font-medium text-zinc-800">{val(r.power, "kW")}</dd>

        <dt className="text-zinc-500">Instalovaný výkon</dt>
        <dd className="font-medium text-zinc-800">{val(r.capacity, "kWp")}</dd>

        <dt className="text-zinc-500">Stav</dt>
        <dd>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </dd>
      </dl>
    </div>
  );
}
