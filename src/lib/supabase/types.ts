export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          code: string;
          dropoff_surcharge_usd: number;
          pickup_surcharge_usd: number;
          requires_stripe: boolean;
          allows_cash: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['locations']['Insert']>;
      };
      item_tiers: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          supported_items: string;
          weight_spec: string | null;
          icon_emoji: string;
          rate_daily_usd: number;
          rate_weekly_usd: number;
          rate_monthly_usd: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['item_tiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['item_tiers']['Insert']>;
      };
      addon_services: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          fee_usd: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['addon_services']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['addon_services']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          phone: string;
          otp_code: string | null;
          otp_expires_at: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          dropoff_location_id: string;
          pickup_location_id: string;
          duration_type: 'daily' | 'weekly' | 'monthly';
          duration_value: number;
          storage_start_date: string;
          storage_end_date: string;
          base_total_usd: number;
          dropoff_surcharge_usd: number;
          pickup_surcharge_usd: number;
          addon_total_usd: number;
          grand_total_usd: number;
          payment_method: 'cash' | 'stripe_simulated';
          payment_status: 'pending' | 'paid' | 'failed';
          booking_status: 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';
          qr_code_token: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at' | 'qr_code_token'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          tier_id: string;
          quantity: number;
          unit_rate_usd: number;
          line_total_usd: number;
        };
        Insert: Omit<Database['public']['Tables']['booking_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['booking_items']['Insert']>;
      };
      booking_addons: {
        Row: {
          id: string;
          booking_id: string;
          addon_id: string;
          fee_usd: number;
        };
        Insert: Omit<Database['public']['Tables']['booking_addons']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['booking_addons']['Insert']>;
      };
      staff: {
        Row: {
          id: string;
          user_id: string;
          role: 'staff' | 'superadmin';
          full_name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          actor_id: string;
          old_values: Json | null;
          new_values: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
