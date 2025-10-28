# CV Upload Setup Instructions

## 1. Add cv_url Column to Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Add cv_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.cv_url IS 'URL to user CV/Resume document (PDF or DOCX)';
```

## 2. Create Storage Bucket

Go to Supabase Dashboard → Storage → Create a new bucket:

- **Bucket name**: `profile-documents`
- **Public bucket**: ✅ Yes (checked)
- Click "Create bucket"

## 3. Set up Storage Policies

After creating the bucket, click on it and go to "Policies" tab, then add these policies:

### Policy 1: Users can upload their own documents
- **Policy name**: Users can upload their own documents
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **USING expression**: Leave empty
- **WITH CHECK expression**:
```sql
bucket_id = 'profile-documents'
```

### Policy 2: Users can update their own documents
- **Policy name**: Users can update their own documents
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'profile-documents'
```

### Policy 3: Users can delete their own documents
- **Policy name**: Users can delete their own documents
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'profile-documents'
```

### Policy 4: Anyone can view documents
- **Policy name**: Anyone can view documents
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**:
```sql
bucket_id = 'profile-documents'
```

## 4. Test the Feature

1. Start the dev server: `npm run dev`
2. Register a new account or log in
3. Go through onboarding
4. In Step 2, upload a PDF or DOCX file
5. Complete onboarding
6. Check your profile to verify the CV was uploaded

## File Validation

The CV upload accepts:
- ✅ PDF files (`.pdf`)
- ✅ DOCX files (`.docx`)
- ❌ Maximum size: 10MB
- ❌ Other formats are rejected

## Storage Structure

CVs are stored in: `profile-documents/cvs/{userId}-cv-{timestamp}.{ext}`

Example: `profile-documents/cvs/abc123-cv-1234567890.pdf`
