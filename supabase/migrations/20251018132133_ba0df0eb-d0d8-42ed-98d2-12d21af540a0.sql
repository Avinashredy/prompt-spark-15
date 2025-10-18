-- Add tool fields to prompts table
ALTER TABLE public.prompts 
ADD COLUMN tool_used text,
ADD COLUMN tool_url text;