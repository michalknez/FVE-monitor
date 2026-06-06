import type { Metadata } from "next";

import type { ApiConfig } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

import { ConfigForm } from "./config-form";

export const metadata: Metadata = {
  title: "Konfigurace API | FVE Monitor",
};

export default async function KonfiguracePage() {
  const supabase = await createClient();

  const [{ data: solaxConfig }, { data: goodweConfig }] = await Promise.all([
    supabase.from("api_configs").select("*").eq("brand", "Solax").maybeSingle<ApiConfig>(),
    supabase.from("api_configs").select("*").eq("brand", "GoodWe").maybeSingle<ApiConfig>(),
  ]);

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Administrace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Konfigurace API elektráren
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Nastavte přístup k cloudovému API výrobce a ověřte připojení proti
            konkrétní elektrárně.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <ConfigForm solaxConfig={solaxConfig ?? null} goodweConfig={goodweConfig ?? null} />
        </section>
      </main>
    </div>
  );
}
