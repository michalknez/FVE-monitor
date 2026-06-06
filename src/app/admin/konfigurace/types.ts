// Typy a počáteční stavy pro Server Actions konfigurační stránky.
// Záměrně mimo soubor s "use server" — ten smí exportovat jen async funkce.

import type { SolaxRealtime } from "@/lib/solax";

export type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSaveState: SaveState = { status: "idle", message: "" };

// Výsledek testu = realtime data ze Solaxu (sdílený typ).
export type TestResult = SolaxRealtime;

export type TestState = {
  status: "idle" | "success" | "error";
  message: string;
  result: TestResult | null;
};

export const initialTestState: TestState = {
  status: "idle",
  message: "",
  result: null,
};
