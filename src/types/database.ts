export type OrderStatus =
  | "AWAITING_QUANTITY"
  | "AWAITING_ADDRESS"
  | "AWAITING_PAYMENT"
  | "PAID_IN_ESCROW"
  | "AWAITING_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Merchant {
  id: string;
  business_name: string;
  whatsapp_number: string;
  payout_bank_code: string;
  payout_account_number: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  phone_number: string;
  address_line_1: string;
  state: string;
  lga: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
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
}

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: Merchant;
        Insert: Omit<Merchant, "created_at" | "updated_at">;
        Update: Partial<Omit<Merchant, "id">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Product, "id" | "merchant_id">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Profile>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at"> & {
          id?: string;
          chat_history?: ChatMessage[];
          payment_ref?: string | null;
          auto_release_at?: string | null;
        };
        Update: Partial<Omit<Order, "id">>;
      };
    };
  };
}
