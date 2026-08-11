/*
# Create private design storage bucket

1. Storage
- Create the private `createfit-designs` bucket for customer-uploaded artwork.
- Files are not publicly readable and must be served through server-controlled signed URLs.

2. Security
- No anon or authenticated storage policies are added.
- Only server-side service-role code may upload or read files until an authenticated upload endpoint is introduced.

3. Important Notes
- The current client keeps a local preview reference and does not send raw files directly to Telegram.
- A future server upload endpoint must enforce JPG, JPEG, PNG, and WEBP content types and a 5 MB size limit before writing to this bucket.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('createfit-designs', 'createfit-designs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
