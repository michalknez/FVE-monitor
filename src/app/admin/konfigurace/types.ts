export type SaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSaveState: SaveState = { status: "idle", message: "" };

export type TestResult = {
  acpower: number | string | null;
  inverterStatus: number | string | null;
  yieldtoday: number | string | null;
  uploadTime: string | null;
};

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
