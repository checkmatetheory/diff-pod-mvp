SELECT 
  id,
  session_name,
  session_data->'video_clips' as video_clips_data
FROM user_sessions 
WHERE id = '9a395756-cb1f-482e-95d1-f14239462b78';
