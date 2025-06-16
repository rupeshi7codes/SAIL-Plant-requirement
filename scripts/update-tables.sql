-- Update the tables to handle custom IDs properly
-- First, drop the existing foreign key constraints
ALTER TABLE supply_history DROP CONSTRAINT IF EXISTS supply_history_req_id_fkey;

-- Modify the tables to use text IDs instead of auto-generated UUIDs
-- This allows us to maintain the same IDs from the frontend

-- Update requirements table
ALTER TABLE requirements ALTER COLUMN id TYPE TEXT;

-- Update supply_history table  
ALTER TABLE supply_history ALTER COLUMN id TYPE TEXT;
ALTER TABLE supply_history ALTER COLUMN req_id TYPE TEXT;

-- Update purchase_orders table
ALTER TABLE purchase_orders ALTER COLUMN id TYPE TEXT;

-- Re-add the foreign key constraint
ALTER TABLE supply_history 
ADD CONSTRAINT supply_history_req_id_fkey 
FOREIGN KEY (req_id) REFERENCES requirements(id) ON DELETE CASCADE;

-- Update RLS policies to work with text IDs
DROP POLICY IF EXISTS "Users can only see their own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can only insert their own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can only update their own purchase orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can only delete their own purchase orders" ON purchase_orders;

DROP POLICY IF EXISTS "Users can only see their own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can only insert their own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can only update their own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can only delete their own requirements" ON requirements;

DROP POLICY IF EXISTS "Users can only see their own supply history" ON supply_history;
DROP POLICY IF EXISTS "Users can only insert their own supply history" ON supply_history;
DROP POLICY IF EXISTS "Users can only update their own supply history" ON supply_history;
DROP POLICY IF EXISTS "Users can only delete their own supply history" ON supply_history;

-- Recreate RLS policies
CREATE POLICY "Users can only see their own purchase orders" ON purchase_orders
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own purchase orders" ON purchase_orders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own purchase orders" ON purchase_orders
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own purchase orders" ON purchase_orders
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only see their own requirements" ON requirements
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own requirements" ON requirements
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own requirements" ON requirements
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own requirements" ON requirements
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only see their own supply history" ON supply_history
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own supply history" ON supply_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can only update their own supply history" ON supply_history
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only delete their own supply history" ON supply_history
    FOR DELETE USING (auth.uid()::text = user_id);
