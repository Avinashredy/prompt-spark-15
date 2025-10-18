import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePromptViews = () => {
  const { user } = useAuth();

  const trackView = async (promptId: string) => {
    try {
      await supabase.rpc('increment_prompt_views', { prompt_id: promptId });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return {
    trackView,
  };
};
