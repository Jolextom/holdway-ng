export type OrderStatus =
  | "AWAITING_QUANTITY"
  | "AWAITING_ADDRESS"
  | "AWAITING_PAYMENT"
  | "PAID_IN_ESCROW"
  | "AWAITING_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

export type Merchant = {
  id: string;
  business_name: string;
  whatsapp_number: string;
  payout_bank_code: string;
  payout_account_number: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  phone_number: string;
  address_line_1: string;
  state: string;
  lga: string;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  merchant_id: string;
  buyer_phone: string | null;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  status: OrderStatus;
  chat_history: ChatMessage[];
  payment_ref: string | null;
  auto_release_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      merchants: {
        Row: Merchant;
        Insert: Omit<Merchant, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Merchant, "id">>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Product, "id" | "merchant_id">>;
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at"> & {
          id?: string;
          chat_history?: ChatMessage[];
          payment_ref?: string | null;
          auto_release_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, "id">>;
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_buyer_phone_fkey";
            columns: ["buyer_phone"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["phone_number"];
          }
        ];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
