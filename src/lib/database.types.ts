export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      designers: {
        Row: {
          id: string;
          name: string;
          avatar: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string | null;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          game_name: string;
          provider_id: string | null;
          status: string;
          designer_id: string | null;
          found_by: string;
          date_found: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_name: string;
          provider_id?: string | null;
          status?: string;
          designer_id?: string | null;
          found_by: string;
          date_found?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_name?: string;
          provider_id?: string | null;
          status?: string;
          designer_id?: string | null;
          found_by?: string;
          date_found?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      asset_brands: {
        Row: {
          id: string;
          asset_id: string;
          brand_id: string;
          reflected: boolean;
          reflected_by: string | null;
          reflected_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          brand_id: string;
          reflected?: boolean;
          reflected_by?: string | null;
          reflected_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          brand_id?: string;
          reflected?: boolean;
          reflected_by?: string | null;
          reflected_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
