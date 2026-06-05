# FVE Monitor — Product Backlog

> Živý dokument. Každá oblast má své user stories a poznámky.
> Status: 📋 Naplánováno | 🔄 V implementaci | ✅ Hotovo

---

## 1. Infrastruktura & Setup ✅

- Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Supabase (PostgreSQL + Auth)
- Netlify (CI/CD z GitHubu)
- CLAUDE.md pro Claude Code kontext

---

## 2. API Konfigurace 🔄

### US-001: Správa API připojení pro značku invertoru
Jako admin chci nakonfigurovat připojení k API cloudové platformy výrobce invertorů,
abych mohl načítat data z elektráren.

**Pole formuláře:**
- Značka (Solax / GoodWe — GoodWe zatím disabled)
- API URL (default: https://global.solaxcloud.com)
- Token / API klíč
- WiFi SN pro testování připojení

**Chování:**
- Uložení konfigurace do tabulky `api_configs` v Supabase
- Načtení existující konfigurace při otevření stránky
- Test připojení: POST /api/v2/dataAccess/realtimeInfo/get → zobrazí acpower, inverterStatus, yieldtoday, uploadTime

**Technické poznámky:**
- Token nesmí opustit server (volání přes Next.js server action)
- Tabulka: api_configs (id, brand, url, token, test_wifi_sn, is_active, created_at, updated_at)

---

## 3. Správa elektráren (Plants)

### US-010: Seznam elektráren
Jako admin chci vidět seznam všech evidovaných elektráren,
abych měl přehled o monitorovaných zařízeních.

### US-011: Přidání / editace elektrárny
Jako admin chci přidat nebo upravit elektrárnu v systému,
abych ji mohl monitorovat a evidovat správné údaje.

**Datový model — tabulka `plants`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| id | uuid | PK |
| wifi_sn | text | Sériové číslo WiFi modulu — klíč pro API dotazy |
| brand | text | Značka invertoru (solax / goodwe) |
| owner_first_name | text | Jméno majitele |
| owner_last_name | text | Příjmení majitele |
| owner_email | text | Email majitele |
| owner_phone | text | Telefon majitele |
| address | text | Adresa instalace |
| gps_lat | numeric | GPS — zeměpisná šířka |
| gps_lng | numeric | GPS — zeměpisná délka |
| reserved_power_kw | numeric | Max. rezervovaný příkon dle SOP (kW) |
| is_active | boolean | Aktivní / neaktivní monitoring |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Sledované proměnné z API (mapování Solax → DB):**
| Proměnná | Solax API pole | Popis |
|----------|---------------|-------|
| DC napětí MPPT 1–4 | vdc1, vdc2, vdc3, vdc4 | Vstupní napětí z FV panelů |
| DC proud MPPT 1–4 | idc1, idc2, idc3, idc4 | Vstupní proud z FV panelů |
| AC napětí L1, L2, L3 | vac1, vac2, vac3 | Napětí na fázích |
| SOC baterie | soc | Úroveň nabití/vybití baterie (%) |
| Teplota baterie | battemper | Teplota baterie (°C) |

**Upřesnění:**
- Jedna elektrárna může mít více invertorů → `wifi_sn` se přesouvá do samostatné tabulky `inverters`
- Detail elektrárny zobrazuje živá data z API (aktuální stav všech invertorů) + konfiguraci

**Datový model — tabulka `inverters`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| id | uuid | PK |
| plant_id | uuid | FK → plants.id |
| wifi_sn | text | Sériové číslo WiFi modulu |
| brand | text | Značka (solax / goodwe) |
| label | text | Pojmenování invertoru (např. "Střecha jih") |
| is_active | boolean | |
| created_at | timestamptz | |

### US-012: Detail elektrárny
Jako admin chci na detailu elektrárny vidět živá aktuální data ze všech jejích invertorů,
abych měl okamžitý přehled o stavu instalace.

**Zobrazené sekce na detailu:**
- Základní info (adresa, majitel, SOP příkon)
- Seznam invertorů s live daty (acpower, inverterStatus, soc, battemper, vdc1–4)
- Mapa s GPS polohou

---

## 4. Sběr a ukládání dat (Data Collection)

### US-020: Automatický sběr dat z invertorů
Jako systém chci každých 15 minut načíst data ze všech aktivních invertorů,
abych měl kompletní historii pro vyhodnocování a reporty.

**Pravidla sběru:**
- Frekvence: každých 15 minut
- Ukládáme pouze pokud invertor vrátí úspěšnou odpověď (success: true)
- Offline invertor = data se neukládají, stav se neloguje
- Data se uchovávají navždy (bez expirace)

**Datový model — tabulka `inverter_readings`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| id | uuid | PK |
| inverter_id | uuid | FK → inverters.id |
| recorded_at | timestamptz | Čas záznamu (z uploadTime v API odpovědi) |
| vdc1–4 | numeric | DC napětí MPPT 1–4 (V) |
| idc1–4 | numeric | DC proud MPPT 1–4 (A) |
| vac1–3 | numeric | AC napětí L1–L3 (V) |
| soc | numeric | Nabití baterie (%) |
| battemper | numeric | Teplota baterie (°C) |
| acpower | numeric | AC výstupní výkon (W) |
| yieldtoday | numeric | Denní výnos (kWh) |
| inverter_status | text | Kód stavu invertoru |
| created_at | timestamptz | Čas uložení záznamu |

**Technická poznámka:**
- Sběr dat zajistí Supabase Edge Function volaná Supabase Cron (pg_cron)
- Edge Function iteruje přes všechny aktivní invertory, volá Solax API, ukládá výsledky
- Rate limit Solax API: max 10 req/min → při více invertorech nutný throttling

---

## 5. Zobrazování dat a historie

### US-030: Detail elektrárny — živá data
Jako admin chci na detailu elektrárny vidět aktuální stav všech jejích invertorů,
abych okamžitě věděl, jestli elektrárna funguje správně.

**Zobrazení:**
- Karta pro každý invertor: acpower, inverterStatus, soc, battemper, vdc1–4

### US-031: Historie — graf
Jako admin chci zobrazit graf vybraných proměnných v čase,
abych viděl průběh výroby a dokázal identifikovat anomálie.

**Chování:**
- Graf napětí MPPT (vdc1–4) a proudu MPPT (idc1–4) — každý tracker vlastní křivka
- Časové rozsahy:
  - Přednastavené: **Dnes** / **Včera**
  - Vlastní: výběr od–do (date picker)
- Data po 15minutových intervalech
- Více proměnných v grafu (přidání dalších v budoucnu)

### US-032: Historie — tabulka
Jako admin chci pod grafem vidět tabulku s hodnotami po 15 minutách,
abych mohl přesně přečíst konkrétní hodnoty v daný čas.

**Chování:**
- Sloupce: čas, vdc1–4, idc1–4 (rozšiřitelné)
- Řazení od nejnovějšího
- Stránkování (data mohou být tisíce řádků)

**Technická poznámka:**
- Graf: knihovna Recharts (již v Next.js ekosystému, kompatibilní s React 19)
- Pro velké časové rozsahy zvážit agregaci dat na straně Supabase (hodinové průměry)

---

## 6. Proměnné a mezní hodnoty — Alerting

⏸ Odloženo na později.

---

## 7. Zákazníci / Majitelé (Customers)

**Upřesnění:** Zákazník = majitel elektrárny. Entita zákazníka je přímo součástí entity elektrárny (viz tabulka `plants` — owner_* pole). Samostatná tabulka zákazníků není potřeba.

### Předplatné
Evidujeme pouze datum, do kdy je předplatné aktivní.

**Rozšíření tabulky `plants`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| subscription_until | date | Datum konce předplatného (null = bez předplatného) |

**Chování:**
- Pokud `subscription_until` < dnes → předplatné expirováno
- Admin vidí stav předplatného v seznamu elektráren
- Reporty se generují pouze pro elektrárny s aktivním předplatným

---

## 8. Reporty (Reports)

⏸ Odloženo — doladíme až budou k dispozici reálná data. Obsah a formát reportů navrhneme společně na základě dat z elektráren.

---

## Otevřené otázky

| # | Otázka | Oblast |
|---|--------|--------|
| 1 | Jaké údaje se evidují ke každé elektrárně? | Elektrárny |
| 2 | Jak často sbírat data z API? | Sběr dat |
| 3 | Které proměnné a jaké mezní hodnoty? | Alerting |
| 4 | Může zákazník přistupovat do aplikace? | Zákazníci |
| 5 | Formát a obsah reportů? | Reporty |
