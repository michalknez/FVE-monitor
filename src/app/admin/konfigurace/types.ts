// Typy a počáteční stavy pro Server Actions konfigurační stránky.
// Záměrně mimo soubor s "use server" — ten smí exportovat jen async funkce.

import type { SolaxRealtime } from "@/lib/solax";

export type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSaveState: SaveState = { status: "idle", message: "" };

// Výsledek testu Solax = realtime data (sdílený typ)
export type TestResult = SolaxRealtime;

// Výsledek testu GoodWe = klíčová data z GetMonitorDetailByPowerstationId
export type GoodWeTestResult = {
  stationName: string | null;
  power: number | null;    // aktuální výkon (kW)
  capacity: number | null; // instalovaný výkon (kWp)
  status: number | null;   // 0=offline, 1=online, 2=alarm
};

export type TestState = {
  status: "idle" | "success" | "error";
  message: string;
  result: TestResult | null;              // Solax realtime data
  goodweResult: GoodWeTestResult | null;  // GoodWe data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawResponse: Record<string, any> | null;
};

export const initialTestState: TestState = {
  status: "idle",
  message: "",
  result: null,
  goodweResult: null,
  rawResponse: null,
};
