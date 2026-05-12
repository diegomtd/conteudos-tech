ALTER TABLE carousel_slides
ADD COLUMN IF NOT EXISTS highlighted_words jsonb DEFAULT '[]'::jsonb;
