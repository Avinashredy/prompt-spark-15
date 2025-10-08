-- Create saved_prompts table
CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_prompt_save UNIQUE (user_id, prompt_id)
);

-- Enable RLS on saved_prompts
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_prompts
CREATE POLICY "Users can view their own saved prompts"
ON public.saved_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save prompts"
ON public.saved_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave prompts"
ON public.saved_prompts FOR DELETE
USING (auth.uid() = user_id);

-- Create prompt_views table for tracking views
CREATE TABLE IF NOT EXISTS public.prompt_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  user_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prompt_views
ALTER TABLE public.prompt_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_views
CREATE POLICY "Anyone can view prompt views"
ON public.prompt_views FOR SELECT
USING (true);

CREATE POLICY "Anyone can create prompt views"
ON public.prompt_views FOR INSERT
WITH CHECK (true);

-- Add views_count column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- Function to update views count
CREATE OR REPLACE FUNCTION public.update_views_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.prompts 
    SET views_count = views_count + 1 
    WHERE id = NEW.prompt_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for views count
DROP TRIGGER IF EXISTS update_prompt_views_count ON public.prompt_views;
CREATE TRIGGER update_prompt_views_count
AFTER INSERT ON public.prompt_views
FOR EACH ROW
EXECUTE FUNCTION public.update_views_count();