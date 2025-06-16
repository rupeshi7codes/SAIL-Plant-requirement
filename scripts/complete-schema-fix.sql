-- First, completely drop all tables and their dependencies
DROP TABLE IF EXISTS supply_history CASCADE;
DROP TABLE IF EXISTS requirements CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;

-- Verify tables are dropped
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_orders', 'requirements', 'supply_history');

-- Create purchase_orders table with explicit TEXT types
CREATE TABLE purchase_orders (
    id TEXT NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    po_date DATE NOT NULL,
    area_of_application TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdf_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create requirements table with explicit TEXT types
CREATE TABLE requirements (
    id TEXT NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    area_of_application TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Pending',
    notes TEXT,
    selected_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create supply_history table with explicit TEXT types
CREATE TABLE supply_history (
    id TEXT NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    req_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    material_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_orders
CREATE POLICY "purchase_orders_select_policy" ON purchase_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "purchase_orders_insert_policy" ON purchase_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "purchase_orders_update_policy" ON purchase_orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "purchase_orders_delete_policy" ON purchase_orders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for requirements
CREATE POLICY "requirements_select_policy" ON requirements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "requirements_insert_policy" ON requirements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "requirements_update_policy" ON requirements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "requirements_delete_policy" ON requirements
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for supply_history
CREATE POLICY "supply_history_select_policy" ON supply_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "supply_history_insert_policy" ON supply_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supply_history_update_policy" ON supply_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "supply_history_delete_policy" ON supply_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_purchase_orders_user_id ON purchase_orders(user_id);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_requirements_user_id ON requirements(user_id);
CREATE INDEX idx_requirements_po_number ON requirements(po_number);
CREATE INDEX idx_supply_history_user_id ON supply_history(user_id);
CREATE INDEX idx_supply_history_req_id ON supply_history(req_id);

-- Verify the schema is correct
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_orders', 'requirements', 'supply_history')
ORDER BY table_name, ordinal_position;
