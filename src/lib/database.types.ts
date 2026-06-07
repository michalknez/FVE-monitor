// Hand-written database types.
// TODO: nahradit generovanými typy ze Supabase (`supabase gen types typescript`).
// Musí zůstat v souladu se schématem tabulek v Supabasu.

export type Database = {
  public: {
    Tables: {
      api_configs: {
        Row: {
          id: string;
          brand: string;
          url: string;
          token: string;
          test_wifi_sn: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          username: string | null;
          password: string | null;
          sems_token: string | null;
          sems_uid: string | null;
          sems_api_url: string | null;
          sems_token_expires_at: string | null;
        };
        Insert: {
          id?: string;
          brand: string;
          url: string;
          token: string;
          test_wifi_sn?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          password?: string | null;
          sems_token?: string | null;
          sems_uid?: string | null;
          sems_api_url?: string | null;
          sems_token_expires_at?: string | null;
        };
        Update: {
          id?: string;
          brand?: string;
          url?: string;
          token?: string;
          test_wifi_sn?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          password?: string | null;
          sems_token?: string | null;
          sems_uid?: string | null;
          sems_api_url?: string | null;
          sems_token_expires_at?: string | null;
        };
        Relationships: [];
      };
      plants: {
        Row: {
          id: string;
          owner_first_name: string;
          owner_last_name: string;
          owner_email: string | null;
          owner_phone: string | null;
          address: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          reserved_power_w: number | null;
          subscription_until: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_first_name: string;
          owner_last_name: string;
          owner_email?: string | null;
          owner_phone?: string | null;
          address?: string | null;
          gps_lat?: number | null;
          gps_lng?: number | null;
          reserved_power_w?: number | null;
          subscription_until?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_first_name?: string;
          owner_last_name?: string;
          owner_email?: string | null;
          owner_phone?: string | null;
          address?: string | null;
          gps_lat?: number | null;
          gps_lng?: number | null;
          reserved_power_w?: number | null;
          subscription_until?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inverters: {
        Row: {
          id: string;
          plant_id: string;
          wifi_sn: string;
          brand: string;
          label: string | null;
          is_active: boolean;
          created_at: string;
          external_id: string | null;
        };
        Insert: {
          id?: string;
          plant_id: string;
          wifi_sn: string;
          brand: string;
          label?: string | null;
          is_active?: boolean;
          created_at?: string;
          external_id?: string | null;
        };
        Update: {
          id?: string;
          plant_id?: string;
          wifi_sn?: string;
          brand?: string;
          label?: string | null;
          is_active?: boolean;
          created_at?: string;
          external_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_monthly_production: {
        Args: { p_inverter_ids: string[] };
        Returns: { inverter_id: string; month: string; monthly_kwh: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ApiConfig = Database["public"]["Tables"]["api_configs"]["Row"];
export type Plant = Database["public"]["Tables"]["plants"]["Row"];
export type Inverter = Database["public"]["Tables"]["inverters"]["Row"];

export type InverterReading = {
  inverter_id: string;
  recorded_at: string;
  soc: number | null;
  battemper: number | null;
  vdc1: number | null;
  vdc2: number | null;
  vdc3: number | null;
  vdc4: number | null;
  idc1: number | null;
  idc2: number | null;
  idc3: number | null;
  idc4: number | null;
  vac1: number | null;
  vac2: number | null;
  vac3: number | null;
  acpower: number | null;
  yieldtoday: number | null;
  inverter_status: string | null;
  feedinpower: number | null;
  powerdc1: number | null;
  powerdc2: number | null;
  powerdc3: number | null;
  powerdc4: number | null;
  batpower: number | null;
  ratedpower: number | null;
};
