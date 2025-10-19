-- Ensure RPC exists and is callable by clients
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

-- Grant execute permission to client roles
GRANT EXECUTE ON FUNCTION public.increment_prompt_views(uuid) TO anon, authenticated;

-- Stop storing per-view rows: remove INSERT policy on prompt_views
DROP POLICY IF EXISTS "Anyone can create prompt views" ON public.prompt_views;

-- Backfill views_count from existing prompt_views data for accuracy
WITH view_totals AS (
  SELECT prompt_id, COUNT(*)::int AS view_count
  FROM public.prompt_views
  GROUP BY prompt_id
)
UPDATE public.prompts p
SET views_count = COALESCE(v.view_count, 0)
FROM view_totals v
WHERE p.id = v.prompt_id;
