# Storage Setup Guide

Since the current database user doesn't have sufficient privileges to create storage policies automatically, please follow these manual steps:

## 1. Create Storage Bucket (if not already created)

\`\`\`sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'po-documents', 
  'po-documents', 
  false, 
  10485760, 
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;
\`\`\`

## 2. Create Storage Policies (requires admin privileges)

Run these commands as a database administrator:

\`\`\`sql
-- Allow users to upload their own PO documents
CREATE POLICY "Users can upload PO documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'po-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own PO documents
CREATE POLICY "Users can view PO documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'po-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own PO documents
CREATE POLICY "Users can update PO documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'po-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own PO documents
CREATE POLICY "Users can delete PO documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'po-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
\`\`\`

## 3. Alternative: Use Service Role Key

If you have access to the service role key, you can create a separate admin client:

\`\`\`typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Use supabaseAdmin for storage operations that require elevated privileges
\`\`\`

## 4. Verify Setup

After setting up the policies, verify they work:

\`\`\`sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'po-documents';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
