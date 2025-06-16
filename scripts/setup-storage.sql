-- Create storage bucket for PO documents (if it doesn't exist)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('po-documents', 'po-documents', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create storage bucket. Please contact your database administrator.';
END $$;

-- Note: Storage policies need to be created by a database administrator
-- The following policies should be created by someone with appropriate privileges:
--
-- CREATE POLICY "Users can upload their own PO documents" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'po-documents' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- CREATE POLICY "Users can view their own PO documents" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'po-documents' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- CREATE POLICY "Users can update their own PO documents" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'po-documents' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- CREATE POLICY "Users can delete their own PO documents" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'po-documents' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Check if bucket was created successfully
SELECT 
    id, 
    name, 
    public,
    created_at
FROM storage.buckets 
WHERE id = 'po-documents';
