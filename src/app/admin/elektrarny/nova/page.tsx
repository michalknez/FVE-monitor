import type { Metadata } from "next";
import Link from "next/link";

import { PlantForm } from "../plant-form";

export const metadata: Metadata = {
  title: "Přidat elektrárnu | FVE Monitor",
};

export default function NovaPage() {
  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <Link href="/admin/elektrarny" className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Elektrárny
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Přidat elektrárnu
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Po vytvoření budete přesměrováni na editaci, kde přidáte invertory.
          </p>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <PlantForm plant={null} />
        </div>
      </main>
    </div>
  );
}
