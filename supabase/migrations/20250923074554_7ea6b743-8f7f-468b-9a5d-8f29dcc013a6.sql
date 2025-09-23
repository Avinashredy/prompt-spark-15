-- Add foreign key relationship from prompts to profiles
-- First, let's add the foreign key constraint
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Also ensure the profiles table has proper indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);