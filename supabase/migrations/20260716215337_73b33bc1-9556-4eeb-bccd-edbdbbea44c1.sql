
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS image_url text;

CREATE POLICY "public read court-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'court-images');

CREATE POLICY "public write court-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'court-images');

CREATE POLICY "public update court-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'court-images') WITH CHECK (bucket_id = 'court-images');

CREATE POLICY "public delete court-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'court-images');
