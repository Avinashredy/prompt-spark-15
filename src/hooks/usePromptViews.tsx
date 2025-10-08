import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePromptViews = () => {
  const { user } = useAuth();

  const trackView = async (promptId: string) => {
    try {
      await supabase
        .from('prompt_views')
        .insert([{
          prompt_id: promptId,
          user_id: user?.id || null,
        }]);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return {
    trackView,
  };
};
