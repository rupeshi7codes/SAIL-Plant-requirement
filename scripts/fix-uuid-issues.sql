-- Drop all existing tables and recreate with proper types
DROP TABLE IF EXISTS supply_history CASCADE;
DROP TABLE IF EXISTS requirements CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;

-- Create purchase_orders table with proper types
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    po_date DATE NOT NULL,
    area_of_application TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    pdf_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requirements table with proper types
CREATE TABLE requirements (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    area_of_application TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Pending',
    notes TEXT,
    selected_items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_history table with proper types
CREATE TABLE supply_history (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    req_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    material_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_orders
CREATE POLICY "Users can only see their own purchase orders" ON purchase_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own purchase orders" ON purchase_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own purchase orders" ON purchase_orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own purchase orders" ON purchase_orders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for requirements
CREATE POLICY "Users can only see their own requirements" ON requirements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own requirements" ON requirements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own requirements" ON requirements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own requirements" ON requirements
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for supply_history
CREATE POLICY "Users can only see their own supply history" ON supply_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own supply history" ON supply_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own supply history" ON supply_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own supply history" ON supply_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_purchase_orders_user_id ON purchase_orders(user_id);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_requirements_user_id ON requirements(user_id);
CREATE INDEX idx_requirements_po_number ON requirements(po_number);
CREATE INDEX idx_supply_history_user_id ON supply_history(user_id);
CREATE INDEX idx_supply_history_req_id ON supply_history(req_id);
