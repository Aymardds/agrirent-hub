-- Add GPS tracking columns to interventions table
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS gps_path JSONB,
ADD COLUMN IF NOT EXISTS area_covered NUMERIC; -- Area in hectares or square meters. We'll use hectares in UI but store raw.

-- Comment on columns
COMMENT ON COLUMN public.interventions.gps_path IS 'Array of GPS coordinates ({lat, lng, timestamp}) recorded during the mission';
COMMENT ON COLUMN public.interventions.area_covered IS 'Calculated area covered during the mission in hectares';
