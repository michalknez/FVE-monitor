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

## 2b. API Konfigurace — GoodWe (budoucí)

**GoodWe SEMS Portal API — odlišnosti od Solax:**

Autentizace probíhá ve dvou krocích:
1. POST `https://www.semsportal.com/api/v1/Common/CrossLogin` s emailem a heslem → vrátí dynamický `token`, `uid`, `timestamp` a `api_url`
2. POST `{api_url}/v1/PowerStation/GetMonitorDetailByPowerstationId` s `powerStationId` a Token hlavičkou

**Rozšíření `api_configs` pro GoodWe:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| username | text | Přihlašovací email do SEMS portálu |
| password | text | Heslo (šifrované) |
| sems_token | text | Dočasný token (cachovat, obnovovat při expiraci) |
| sems_uid | text | UID z CrossLogin response |
| sems_api_url | text | Dynamická API URL z CrossLogin response |

**Identifikátor invertoru:** `powerStationId` (z URL portálu semsportal.com) — uložit v tabulce `inverters` jako nové pole `external_id`

**Implementační poznámky:**
- Token expiruje → Edge Function musí detekovat expiraci a volat CrossLogin znovu
- Limit: 3600 volání/hod (výrazně více než Solax 10/min)
- Oficiální OpenAPI vyžaduje licenční smlouvu → používáme SEMS Portal API

### US-002: Konfigurace GoodWe API na stránce /admin/konfigurace

**Změny v UI — dynamický formulář podle značky:**

Když uživatel vybere **Solax** (stávající chování):
- API URL (editovatelné, default: https://global.solaxcloud.com)
- Token (password input)
- WiFi SN pro test

Když uživatel vybere **GoodWe** (nové):
- API URL skryto (fixní: https://www.semsportal.com — zobrazit jako read-only info)
- Email (přihlašovací email do SEMS portálu)
- Heslo (password input)
- PowerStation ID pro test (najde se v URL portálu: semsportal.com/PowerStation/PowerStatusSnMin/**{ID}**)

**Test připojení GoodWe — dva kroky na serveru:**
1. CrossLogin → získej token, uid, api_url
2. GetMonitorDetailByPowerstationId → ověř připojení a zobraz data elektrárny

**Databázové změny — rozšíření tabulky `api_configs`:**
```sql
alter table api_configs
  add column username text,           -- GoodWe: SEMS email
  add column password text,           -- GoodWe: SEMS heslo (šifrované vault)
  add column sems_token text,         -- GoodWe: cachovaný session token
  add column sems_uid text,           -- GoodWe: uid z CrossLogin
  add column sems_api_url text,       -- GoodWe: dynamická API URL z CrossLogin
  add column sems_token_expires_at timestamptz; -- GoodWe: expirace tokenu
```

**Databázové změny — tabulka `inverters`:**
```sql
alter table inverters
  add column external_id text; -- GoodWe: powerStationId; Solax: prázdné (používá wifi_sn)
```

**Bezpečnostní poznámka:**
Heslo GoodWe ukládat přes Supabase Vault (ne plain text) — `vault.create_secret()`.

**Formulář — technická implementace:**
- React state pro sledování vybrané značky
- Podmíněné renderování polí podle značky
- Server action `saveConfig` rozlišuje brand a ukládá správná pole
- Server action `testConnection` volá správnou logiku podle brand

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
| mppt_count | integer | Počet MPPT trackerů (1–4) — určuje kolik DC napětí zobrazovat |
| is_active | boolean | |
| created_at | timestamptz | |

**⚠️ TODO:** Přidat pole `mppt_count` do tabulky `inverters` v Supabase + do formuláře přidání/editace invertoru. Grafy DC napětí zobrazovat pouze pro aktivní trackery (vdc1 až vdc{mppt_count}).

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

**⚠️ K řešení — mechanismus spouštění:**
Možnosti implementace pravidelného sběru dat každých 15 minut:

A) **Supabase pg_cron + Edge Function** (doporučeno)
   - pg_cron job v Supabase spouští Edge Function každých 15 min
   - Edge Function volá Solax API a ukládá do DB
   - Vše v rámci Supabase ekosystému, bez externích závislostí
   - Omezení: Edge Function max. 150s běhu → throttling nutný

B) **Netlify Scheduled Functions**
   - Netlify cron job volá Next.js API route každých 15 min
   - Jednodušší implementace, ale závislost na Netlify plánu

C) **Externí cron (GitHub Actions / cron-job.org)**
   - Volný cron service pinguje Next.js API endpoint
   - Nejjednodušší, ale méně spolehlivé

→ Doporučení: varianta A (Supabase pg_cron + Edge Function)

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

### US-040: Sledování minimálního SOC a doporučení MinSOC
Jako admin chci sledovat nejnižší dosažený SOC baterie v průběhu dne,
abych mohl doporučit zákazníkovi navýšení MinSOC při nedostatečné záloze.

**Sezónní konfigurace (rozšíření `api_configs` nebo samostatná tabulka `seasons`):**
| Atribut | Typ | Popis |
|---------|-----|-------|
| winter_start | date (MM-DD) | Začátek zimního období (např. 10-01) |
| winter_end | date (MM-DD) | Konec zimního období (např. 03-31) |
| summer_start | date (MM-DD) | Začátek letního období (např. 04-01) |
| summer_end | date (MM-DD) | Konec letního období (např. 09-30) |

**Logika vyhodnocení:**
- Každý den najdi nejnižší zaznamenaný SOC elektrárny (min. z `inverter_readings.soc`)
- Porovnej s prahovými hodnotami (budou definovány — jiné pro léto/zimu)
- Pokud SOC klesne pod práh → doporučení pro admina: "Zvažte navýšení MinSOC na invertoru X"

**Poznámky k doplnění:**
- Jaká je prahová hodnota SOC pro doporučení? (např. pokud min. SOC < 20 % v zimě)
- Doporučení zobrazit v aplikaci, nebo poslat emailem?
- Je MinSOC nastavení per elektrárna, nebo globální?

---

## 7. Zákazníci / Majitelé (Customers)

**Upřesnění:** Zákazník = majitel elektrárny. Entita zákazníka je přímo součástí entity elektrárny (viz tabulka `plants` — owner_* pole). Samostatná tabulka zákazníků není potřeba.

### Předplatné
Evidujeme pouze datum, do kdy je předplatné aktivní.

**Rozšíření tabulky `plants`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| subscription_until | date | Datum konce předplatného (null = bez předplatného) |
| export_limit_mode | enum | Režim hlídání přetoků: none / static / price_based |
| export_limit_w | integer | Statický limit přetoku (W) — platí jen pro mode=static |

**Režimy hlídání přetoků (`export_limit_mode`):**
- **none** — přetoky se nehlídají
- **static** — hlídá se pevný limit v W zadaný ručně (`export_limit_w`) — vhodné pro instalace s pevnou smlouvou o přetoku se sítí
- **price_based** — limit se mění podle aktuální ceny elektřiny (logika k upřesnění — kdy se vyplatí přetáčet, kdy ne)

---

### US-035: Import spotových cen elektřiny

**Zdroj dat: spotovaelektrina.cz (zdarma, OTE-ČR data)**

Klíčové endpointy:
| Endpoint | Vrací | Použití |
|----------|-------|---------|
| `GET /api/v1/price/get-actual-price-czk` | aktuální cena Kč/MWh | zobrazení aktuální ceny |
| `GET /api/v1/price/get-actual-price-level` | low / medium / high | rychlé pásmo |
| `GET /api/v1/price/get-actual-price-json` | detail aktuální čtvrthodiny (JSON) | přesná hodnota + timestamp |
| `GET /api/v1/price/get-prices-json-qh` | dnešek + zítřek, čtvrthodinově | uložení do DB, plánování |

**Důležité:** od 1. 10. 2025 jsou data čtvrthodinová = shoduje se s naším 15min sběrem dat z invertorů.

**Datový model — tabulka `spot_prices`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| id | uuid | PK |
| interval_start | timestamptz | Začátek čtvrthodiny |
| interval_end | timestamptz | Konec čtvrthodiny |
| price_czk_mwh | numeric | Cena Kč/MWh |
| price_level | text | low / medium / high |
| created_at | timestamptz | |

**Implementace:**
- Supabase Edge Function `fetch-spot-prices` volaná pg_cron jednou denně po 14:00 (kdy jsou k dispozici ceny na zítřek)
- Stáhne čtvrthodinové ceny pro dnešek + zítřek a upsertne do `spot_prices`
- Konverze: API vrací Kč/MWh → pro zobrazení převést na Kč/kWh (dělit 1000)

---

### US-036: Hlídání přetoků vůči limitní ceně

**Konfigurace per elektrárna — rozšíření tabulky `plants`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| export_limit_mode | text | none / static / price_based |
| export_limit_w | integer | Statický limit (W) pro mode=static |
| export_price_threshold_czk | numeric | Limitní cena Kč/MWh — přetoky nevhodné pod touto cenou |

**Logika hlídání (mode=price_based):**
1. Při každém sběru dat (15 min) porovnej:
   - `inverter_readings.feedinpower` > 0 (elektrárna přetáčí do sítě)
   - Aktuální spotová cena (`spot_prices` pro daný interval) < `export_price_threshold_czk`
2. Pokud obě podmínky platí → zaloguj upozornění do tabulky `alerts`
3. Admin vidí upozornění na stránce Data Monitoring: "Elektrárna X přetáčí při ceně Y Kč/MWh (pod limitem Z Kč/MWh)"

**Příklad nastavení:**
- Zákazník nechce přetáčet při ceně pod 500 Kč/MWh → `export_price_threshold_czk = 500`
- Systém upozorní, když spot cena < 500 Kč/MWh a `feedinpower` > 0

**Otevřené otázky:**
- Zobrazovat aktuální spot cenu rovnou na dashboardu / detailu elektrárny?
- Zítřejší ceny po 14:00 — chceš prediktivní upozornění ("zítra ráno bude cena nízká")?

**Chování:**
- Pokud `subscription_until` < dnes → předplatné expirováno
- Admin vidí stav předplatného v seznamu elektráren
- Reporty se generují pouze pro elektrárny s aktivním předplatným

---

## 7b. Počasí podle GPS elektrárny

### US-037: Import počasí a zobrazení na detailu elektrárny

**Zdroj dat: Open-Meteo (zdarma, bez API klíče)**

API volání:
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={gps_lat}
  &longitude={gps_lng}
  &hourly=temperature_2m,cloud_cover,shortwave_radiation,precipitation,weather_code
  &timezone=Europe/Prague
  &forecast_days=3
```

**Proměnné relevantní pro FV monitoring:**
| Proměnná | Jednotka | Použití |
|----------|----------|---------|
| `shortwave_radiation` | W/m² | Globální sluneční záření — koreluje s výrobou FV |
| `cloud_cover` | % | Oblačnost — vysvětluje pokles výkonu trackerů |
| `temperature_2m` | °C | Teplota — vliv na účinnost panelů |
| `precipitation` | mm | Srážky |
| `weather_code` | WMO kód | Typ počasí (jasno, oblačno, déšť, sníh...) |

**Výhody Open-Meteo:**
- Zcela zdarma, bez API klíče, bez registrace
- GPS souboradnice přímo z tabulky `plants` (gps_lat, gps_lng)
- Předpověď až 16 dní dopředu
- Čtvrthodinové a hodinové rozlišení
- Pokrývá celou ČR (model DWD + ECMWF)

**Datový model — tabulka `weather_forecasts`:**
| Atribut | Typ | Popis |
|---------|-----|-------|
| id | uuid | PK |
| plant_id | uuid | FK → plants.id |
| interval_start | timestamptz | Začátek hodiny |
| shortwave_radiation | numeric | Sluneční záření (W/m²) |
| cloud_cover | integer | Oblačnost (%) |
| temperature | numeric | Teplota (°C) |
| precipitation | numeric | Srážky (mm) |
| weather_code | integer | WMO kód počasí |
| created_at | timestamptz | |

**Implementace:**
- Edge Function `fetch-weather` volaná pg_cron každé 3 hodiny
- Stáhne předpověď pro každou aktivní elektrárnu dle GPS a upsertne do DB
- Žádný API klíč — volání přímo z Edge Function

**Zobrazení na detailu elektrárny:**
- Aktuální počasí (ikonka + teplota + oblačnost + záření W/m²) v hlavičce stránky
- Předpověď na dnešek/zítřek — mini pruh s hodinovými hodnotami záření
- Korelace: porovnání předpovězeného záření vs. skutečného výkonu FV (odhalí anomálie způsobené počasím vs. technickou závadou)

**Budoucí možnost — Forecast.Solar:**
Specializovaná služba předpovídající přímo výrobu FV v kWh na základě parametrů panelů (kWp, sklon, azimut). Vhodné pro pozdější fázi kdy budeme evidovat technické parametry instalace.

---

## 8. Měsíční souhrny výroby

### US-050: Denní a měsíční výroba
Jako admin chci vidět denní a měsíční přehled výroby každé elektrárny,
abych měl přehled o celkové produkci za období.

**Logika výpočtu:**
- Denní výroba = max(yieldtoday) za daný den (Solax API vrací kumulativní denní hodnotu — maximum dne = celková denní výroba)
- Měsíční výroba = součet denních výrob za měsíc
- Výpočet per invertor, pak součet za celou elektrárnu

**Návrh implementace:**
- Supabase view nebo materialized view `daily_yield` (inverter_id, date, yield_kwh)
- Alternativa: výpočet v Next.js ze surových dat
- Zobrazení: tabulka měsíců + sloupcový graf

**Upřesnění:**
- Zobrazovat per invertor + součet za elektrárnu
- Rozsah: vše od začátku monitoringu

---

## 9. Detekce anomálií MPPT

### US-060: Detekce výpadků a sníženého výkonu MPPT trackerů
Jako admin chci být upozorněn na anomálie v datových řadách MPPT trackerů,
abych mohl včas identifikovat problém (stínění, porucha panelu, odpojený string).

**Typy anomálií k detekci:**
1. **Výpadek trackeru** — vdc nebo idc = 0 zatímco ostatní trackery téhož invertoru mají nenulové hodnoty a je den (acpower > 0)
2. **Abnormálně snížený výkon** — výkon jednoho MPPT trackeru je výrazně nižší než průměr ostatních trackerů téhož invertoru ve stejný čas (např. < 50 % průměru)
3. **Asymetrie trackerů** — dlouhodobá odchylka jednoho trackeru od ostatních (přes více dní)

**Návrh logiky:**
- Porovnávej trackery navzájem v rámci jednoho invertoru (relativní anomálie)
- Vyhodnocuj pouze v denních hodinách (acpower > 0 nebo soc stoupá)
- Výsledek: seznam anomálií s časem, invertorem, číslem trackeru a typem problému

**Upřesnění — kde zobrazovat:**
1. **Stránka /admin/data-monitoring** — přehled všech aktivních upozornění napříč elektrárny, seřazeno dle závažnosti/času
2. **Detail invertoru /admin/elektrarny/[id]/invertor/[id]** — relativní srovnání výkonu trackerů:
   - Tracker vs. ostatní trackery téhož invertoru
   - Tracker vs. průměr všech invertorů na elektrárně
   - Vizualizace odchylek (graf nebo barevné indikátory)

**Výchozí hodnoty (doporučené, upravitelné per střídač):**
- Prahová odchylka výkonu: **60 %** — tracker flagován pokud vyrábí méně než 60 % průměru ostatních trackerů téhož střídače. Tato hodnota eliminuje krátkodobé zastínění (oblak) ale zachytí dlouhodobý problém (nečistoty, závada panelu, odpojený string).
- Minimální délka anomálie: **3 měření po sobě (45 min)** — zabraňuje falešným alarmům z průchodu mraku nebo restartu střídače.

**Rozšíření tabulky `inverters` o konfiguraci anomálií:**
| Atribut | Typ | Výchozí | Popis |
|---------|-----|---------|-------|
| anomaly_threshold_pct | integer | 60 | Práh výkonu trackeru vůči průměru (%) |
| anomaly_min_readings | integer | 3 | Počet po sobě jdoucích měření pro alarm |

**Stránka nastavení anomálií:** součást formuláře editace střídače na /admin/elektrarny/[id]/upravit

---

## 10. Reporty (Reports)

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
