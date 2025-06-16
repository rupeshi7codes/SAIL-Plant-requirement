-- Add PDF file columns to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS pdf_file_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;

-- Update existing records to have NULL values for the new columns
UPDATE purchase_orders 
SET pdf_file_url = NULL, pdf_file_name = NULL 
WHERE pdf_file_url IS NULL OR pdf_file_name IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND column_name IN ('pdf_file_url', 'pdf_file_name')
ORDER BY column_name;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_orders'
ORDER BY ordinal_position;
