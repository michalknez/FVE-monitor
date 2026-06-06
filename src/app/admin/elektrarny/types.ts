// Typy a počáteční stavy pro Server Actions domény Elektrárny.
// Mimo soubor s "use server" — ten smí exportovat jen async funkce.

export type PlantSaveState = {
  status: "idle" | "success" | "error";
  message: string;
  plantId?: string; // vyplní se po vytvoření nové elektrárny (pro redirect na editaci)
};

export const initialPlantSaveState: PlantSaveState = { status: "idle", message: "" };

export type InverterState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialInverterState: InverterState = { status: "idle", message: "" };
