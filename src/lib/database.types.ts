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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ApiConfig = Database["public"]["Tables"]["api_configs"]["Row"];
