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
          reserved_power_kw: number | null;
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
          reserved_power_kw?: number | null;
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
          reserved_power_kw?: number | null;
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
        };
        Insert: {
          id?: string;
          plant_id: string;
          wifi_sn: string;
          brand: string;
          label?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plant_id?: string;
          wifi_sn?: string;
          brand?: string;
          label?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ApiConfig = Database["public"]["Tables"]["api_configs"]["Row"];
export type Plant = Database["public"]["Tables"]["plants"]["Row"];
export type Inverter = Database["public"]["Tables"]["inverters"]["Row"];
