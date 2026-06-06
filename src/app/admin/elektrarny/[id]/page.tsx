import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { InverterReading } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { DailyCharts } from "./daily-charts";

export const metadata: Metadata = {
  title: "Detail elektrárny | FVE Monitor",
};

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plant, error }, { data: inverters }] = await Promise.all([
    supabase.from("plants").select("*").eq("id", id).single(),
    supabase.from("inverters").select("*").eq("plant_id", id).order("created_at"),
  ]);

  if (error || !plant) notFound();

  const today = new Date().toISOString().slice(0, 10);

  const inverterIds = inverters?.map((i) => i.id) ?? [];
  let readings: InverterReading[] = [];
  if (inverterIds.length > 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("inverter_readings")
      .select("inverter_id, recorded_at, soc, battemper, vdc1, vdc2, vdc3, vdc4, idc1, idc2, idc3, idc4, vac1, vac2, vac3, acpower, yieldtoday")
      .in("inverter_id", inverterIds)
      .gte("recorded_at", startOfDay.toISOString())
      .order("recorded_at")
      .returns<InverterReading[]>();
    readings = data ?? [];
  }

  const inverterChartData = (inverters ?? []).map((inv) => ({
    id: inv.id,
    label: inv.label,
    readings: readings.filter((r) => r.inverter_id === inv.id),
  }));
  const subscribed = plant.subscription_until ? plant.subscription_until >= today : false;

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/elektrarny"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            >
              ← Elektrárny
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {plant.owner_first_name} {plant.owner_last_name}
            </h1>
          </div>
          <Link
            href={`/admin/elektrarny/${id}/upravit`}
            className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Upravit
          </Link>
        </header>

        {/* Majitel */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Majitel
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-zinc-500">Jméno</dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {plant.owner_first_name} {plant.owner_last_name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">E-mail</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.owner_email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Telefon</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.owner_phone ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Instalace */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Instalace
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-zinc-500">Adresa</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.address ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">GPS</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.gps_lat != null && plant.gps_lng != null
                  ? `${plant.gps_lat}, ${plant.gps_lng}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Rezervovaný příkon</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.reserved_power_kw != null ? `${plant.reserved_power_kw} kW` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Předplatné do</dt>
              <dd className="mt-0.5 flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
                {plant.subscription_until ?? "—"}
                {plant.subscription_until && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      subscribed
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {subscribed ? "Aktivní" : "Expirováno"}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Monitoring</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    plant.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {plant.is_active ? "Aktivní" : "Neaktivní"}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Denní grafy */}
        {inverterIds.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Dnešní grafy
            </h2>
            <DailyCharts inverters={inverterChartData} />
          </section>
        )}

        {/* Invertory */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Invertory ({inverters?.length ?? 0})
          </h2>
          {!inverters?.length ? (
            <p className="text-sm text-zinc-500">Zatím žádné invertory.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Název</th>
                    <th className="px-4 py-2.5 font-medium">WiFi SN</th>
                    <th className="px-4 py-2.5 font-medium">Značka</th>
                    <th className="px-4 py-2.5 font-medium">Stav</th>
                    <th className="px-4 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {inverters.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {inv.label ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {inv.wifi_sn}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {inv.brand}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {inv.is_active ? "Aktivní" : "Neaktivní"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/elektrarny/${id}/invertor/${inv.id}`}
                          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
