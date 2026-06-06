import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { PlantForm } from "../../plant-form";
import { InverterSection } from "./inverter-section";

export const metadata: Metadata = {
  title: "Upravit elektrárnu | FVE Monitor",
};

export default async function UpravitPage({
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

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-3xl space-y-8">
        <header>
          <Link
            href={`/admin/elektrarny/${id}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            ← {plant.owner_first_name} {plant.owner_last_name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Upravit elektrárnu
          </h1>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Základní údaje
          </h2>
          <PlantForm plant={plant} />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Invertory ({inverters?.length ?? 0})
          </h2>
          <InverterSection inverters={inverters ?? []} plantId={id} />
        </section>
      </main>
    </div>
  );
}
