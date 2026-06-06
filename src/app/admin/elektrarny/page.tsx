import type { Metadata } from "next";
import Link from "next/link";

import type { Plant } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Elektrárny | FVE Monitor",
};

type PlantRow = Plant & { inverters: [{ count: number }] | [] };

function subscriptionBadge(until: string | null, today: string) {
  if (!until) return null;
  const active = until >= today;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {active ? `do ${until}` : "Expirováno"}
    </span>
  );
}

export default async function ElektrarnyPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: plants, error } = await supabase
    .from("plants")
    .select("*, inverters(count)")
    .order("created_at", { ascending: false })
    .returns<PlantRow[]>();

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Administrace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Elektrárny
            </h1>
          </div>
          <Link
            href="/admin/elektrarny/nova"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Přidat elektrárnu
          </Link>
        </header>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Chyba načtení: {error.message}
          </p>
        )}

        {!error && (!plants || plants.length === 0) && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Zatím tu nejsou žádné elektrárny. Začněte tlačítkem „Přidat elektrárnu".
            </p>
          </div>
        )}

        {plants && plants.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Majitel</th>
                  <th className="px-4 py-3 font-medium">Adresa</th>
                  <th className="px-4 py-3 font-medium text-right">Invertory</th>
                  <th className="px-4 py-3 font-medium">Předplatné</th>
                  <th className="px-4 py-3 font-medium">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {plants.map((p) => {
                  const inverterCount = p.inverters?.[0]?.count ?? 0;
                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/elektrarny/${p.id}`}
                          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                        >
                          {p.owner_first_name} {p.owner_last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {p.address ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {inverterCount}
                      </td>
                      <td className="px-4 py-3">
                        {subscriptionBadge(p.subscription_until, today) ?? (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {p.is_active ? "Aktivní" : "Neaktivní"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
