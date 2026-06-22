-- Create Order Status Enum
CREATE TYPE order_status AS ENUM (
    'AWAITING_QUANTITY',
    'AWAITING_ADDRESS',
    'AWAITING_PAYMENT',
    'PAID_IN_ESCROW',
    'AWAITING_CONFIRMATION',
    'COMPLETED',
    'CANCELLED'
);

-- 1. Create Merchants Table
CREATE TABLE merchants (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    whatsapp_number TEXT UNIQUE NOT NULL,
    payout_bank_code TEXT NOT NULL,
    payout_account_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Profiles Table (Buyers)
CREATE TABLE profiles (
    phone_number TEXT PRIMARY KEY,
    address_line_1 TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    buyer_phone TEXT REFERENCES profiles(phone_number) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_amount NUMERIC(12, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'AWAITING_QUANTITY',
    chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_ref TEXT,
    auto_release_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Trigger to Tables
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ─── Merchants Policies ──────────────────────────────────────────────────────
CREATE POLICY select_own_merchant ON merchants 
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY insert_own_merchant ON merchants 
    FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY update_own_merchant ON merchants 
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── Products Policies ───────────────────────────────────────────────────────
CREATE POLICY select_public_products ON products 
    FOR SELECT TO public USING (is_active = true OR (auth.uid() = merchant_id));

CREATE POLICY insert_merchant_products ON products 
    FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());

CREATE POLICY update_merchant_products ON products 
    FOR UPDATE TO authenticated USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid());

CREATE POLICY delete_merchant_products ON products 
    FOR DELETE TO authenticated USING (merchant_id = auth.uid());

-- ─── Profiles Policies (Public / Webhook-driven) ────────────────────────────
CREATE POLICY public_access_profiles ON profiles 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- ─── Orders Policies ─────────────────────────────────────────────────────────
-- Merchants can view and update their own orders
CREATE POLICY select_merchant_orders ON orders 
    FOR SELECT TO authenticated USING (merchant_id = auth.uid());

CREATE POLICY update_merchant_orders ON orders 
    FOR UPDATE TO authenticated USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid());

-- Public can insert orders (for storefront checkout checkout flow)
CREATE POLICY insert_public_orders ON orders 
    FOR INSERT TO public WITH CHECK (true);

-- Public can view specific orders by UUID (un-guessable ID checkout tracking)
CREATE POLICY select_public_orders ON orders 
    FOR SELECT TO public USING (true);
