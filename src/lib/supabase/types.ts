export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string; name: string; slug: string; description: string | null;
          image_url: string | null; parent_id: string | null; active: boolean;
          order_index: number; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string; name: string; slug: string; description: string | null;
          code: string | null; category_id: string | null; base_price: number;
          pix_price: number | null; sale_price: number | null; stock: number;
          active: boolean; featured: boolean; is_new: boolean; is_bestseller: boolean;
          images: Json; created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_variants: {
        Row: {
          id: string; product_id: string; color: string | null; size: string | null;
          stock: number; sku: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_variants"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string; auth_id: string | null; name: string; email: string;
          phone: string | null; cpf: string | null; birth_date: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string; customer_id: string; label: string; cep: string; street: string;
          number: string; complement: string | null; neighborhood: string;
          city: string; state: string; is_default: boolean; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["addresses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string; order_number: string; customer_id: string | null; status: string;
          payment_method: string | null; payment_status: string; subtotal: number;
          shipping_cost: number; discount: number; total: number;
          shipping_address: Json | null; notes: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string; order_id: string; product_id: string | null; variant_id: string | null;
          product_name: string; product_image: string | null; color: string | null;
          size: string | null; quantity: number; unit_price: number; total_price: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      coupons: {
        Row: {
          id: string; code: string; type: string; value: number; min_order_value: number;
          max_uses: number | null; used_count: number; active: boolean;
          expires_at: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["coupons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
      };
      hero_slides: {
        Row: {
          id: string; type: string; src: string; alt: string | null; poster: string | null;
          cta_text: string | null; cta_href: string | null; order_index: number;
          active: boolean; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["hero_slides"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["hero_slides"]["Insert"]>;
      };
      site_settings: {
        Row: { id: string; key: string; value: Json; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["site_settings"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
      admin_users: {
        Row: {
          id: string; auth_id: string; name: string; email: string;
          role: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["admin_users"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
      };
    };
  };
}
