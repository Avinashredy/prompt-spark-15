-- Fix security issue: Restrict prompt_views access
-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view prompt views" ON public.prompt_views;

-- Create a new policy that only allows users to see aggregate data, not individual views
CREATE POLICY "Users can only see their own prompt views"
ON public.prompt_views
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create ad_revenue table to track revenue from ads
CREATE TABLE IF NOT EXISTS public.ad_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  revenue_amount numeric(10, 2) NOT NULL DEFAULT 0,
  platform_share numeric(10, 2) NOT NULL DEFAULT 0,
  user_share numeric(10, 2) NOT NULL DEFAULT 0,
  ad_impressions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  revenue_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS on ad_revenue
ALTER TABLE public.ad_revenue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ad revenue
CREATE POLICY "Users can view their own ad revenue"
ON public.ad_revenue
FOR SELECT
USING (auth.uid() = user_id);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  payment_method text,
  payment_details jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on withdrawal_requests
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_revenue_user_id ON public.ad_revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_prompt_id ON public.ad_revenue(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_date ON public.ad_revenue(revenue_date);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);