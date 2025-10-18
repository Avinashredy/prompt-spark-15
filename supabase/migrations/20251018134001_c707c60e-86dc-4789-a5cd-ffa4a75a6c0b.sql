-- Create function to increment prompt views
CREATE OR REPLACE FUNCTION public.increment_prompt_views(prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts 
  SET views_count = views_count + 1 
  WHERE id = prompt_id;
END;
$$;