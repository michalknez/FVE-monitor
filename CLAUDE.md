@AGENTS.md

# FVE Monitor — projektový kontext pro Claude Code

## Co projekt dělá
Webová aplikace pro monitoring fotovoltaických elektráren.
- Načítá stavová data z API jednotlivých elektráren
- Sbírá a ukládá historická data o proměnných elektráren
- Hlídá mezní a nestandardní hodnoty definovaných proměnných (alerting)
- Generuje reporty pro zákazníky
- Eviduje zákazníky a spravuje jejich předplatné pro reporty

## Tech stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Hosting:** Netlify (CI/CD napojeno na GitHub)
- **Verzování:** GitHub

## Klíčové domény
- **Elektrárny (Plants)** — seznam elektráren, API integrace, sběr dat
- **Proměnné (Variables)** — konfigurace sledovaných proměnných a jejich mezních hodnot
- **Alerting** — detekce nestandardních stavů, notifikace
- **Reporty (Reports)** — generování a distribuce reportů zákazníkům
- **Zákazníci (Customers)** — evidence, správa předplatného

## Konvence
- Veškerý kód v TypeScriptu, žádný `any` bez komentáře proč
- App Router — vše v `src/app/`, server components jako default
- Supabase klient: `src/lib/supabase/` (server.ts a client.ts zvlášť)
- Databázové typy generovat ze Supabase (`supabase gen types`)
- Tailwind pro styling, žádné inline styly
- Názvy souborů: kebab-case, komponenty: PascalCase

## Prostředí
- `.env.local` obsahuje `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Nikdy necommitovat `.env.local` ani secrets do Gitu

## Co zatím není rozhodnuto
- Konkrétní API formáty jednotlivých elektráren (upřesní se)
- Přesné proměnné a jejich mezní hodnoty (upřesní se)
- Platební brána pro předplatné (upřesní se)
