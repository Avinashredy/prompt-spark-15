-- Create enum for monetization status
CREATE TYPE public.monetization_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_monetization table
CREATE TABLE public.user_monetization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_monetized BOOLEAN NOT NULL DEFAULT false,
  status public.monetization_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_monetization ENABLE ROW LEVEL SECURITY;

-- Users can view their own monetization status
CREATE POLICY "Users can view their own monetization status"
ON public.user_monetization
FOR SELECT
USING (auth.uid() = user_id);

-- Users can request monetization
CREATE POLICY "Users can request monetization"
ON public.user_monetization
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_monetization_user_id ON public.user_monetization(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_monetization_updated_at
BEFORE UPDATE ON public.user_monetization
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();