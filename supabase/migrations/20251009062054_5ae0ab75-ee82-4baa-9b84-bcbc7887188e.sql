-- Add new columns to prompts table
ALTER TABLE public.prompts 
ADD COLUMN output_url text,
ADD COLUMN price numeric(10,2) DEFAULT 0 CHECK (price >= 0),
ADD COLUMN is_paid boolean DEFAULT false;

-- Create prompt_steps table for step-wise prompts
CREATE TABLE public.prompt_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  step_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, step_number)
);

-- Enable RLS on prompt_steps
ALTER TABLE public.prompt_steps ENABLE ROW LEVEL SECURITY;

-- Prompt steps are viewable by everyone
CREATE POLICY "Prompt steps are viewable by everyone"
ON public.prompt_steps
FOR SELECT
USING (true);

-- Users can manage steps for their own prompts
CREATE POLICY "Users can manage their own prompt steps"
ON public.prompt_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.prompts
    WHERE prompts.id = prompt_steps.prompt_id
    AND prompts.user_id = auth.uid()
  )
);

-- Create prompt_purchases table
CREATE TABLE public.prompt_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  purchase_price numeric(10,2) NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Enable RLS on prompt_purchases
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.prompt_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create purchases (this will be handled by a secure function later)
CREATE POLICY "Users can create their own purchases"
ON public.prompt_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update prompts RLS policy for paid content
DROP POLICY IF EXISTS "Prompts are viewable by everyone" ON public.prompts;

-- Free prompts and own prompts are always viewable
-- Paid prompts only viewable if purchased or owned
CREATE POLICY "Prompts visibility based on payment"
ON public.prompts
FOR SELECT
USING (
  is_paid = false 
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.prompt_purchases
    WHERE prompt_purchases.prompt_id = prompts.id
    AND prompt_purchases.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_prompt_steps_prompt_id ON public.prompt_steps(prompt_id);
CREATE INDEX idx_prompt_purchases_user_id ON public.prompt_purchases(user_id);
CREATE INDEX idx_prompt_purchases_prompt_id ON public.prompt_purchases(prompt_id);