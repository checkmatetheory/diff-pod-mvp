-- Create storage buckets for audio/video files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-uploads', 'session-uploads', false);

-- Create storage policies for user uploads
CREATE POLICY "Users can upload their own session files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own session files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own session files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own session files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);