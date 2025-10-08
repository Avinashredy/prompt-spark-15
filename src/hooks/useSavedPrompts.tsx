import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSavedPrompts = () => {
  const { user } = useAuth();
  const [savedPromptIds, setSavedPromptIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchSavedPrompts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('saved_prompts')
      .select('prompt_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved prompts:', error);
    } else {
      const savedIds = new Set(data.map(sp => sp.prompt_id));
      setSavedPromptIds(savedIds);
    }
    
    setLoading(false);
  };

  const toggleSave = async (promptId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const isSaved = savedPromptIds.has(promptId);

    if (isSaved) {
      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      setSavedPromptIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
    } else {
      const { error } = await supabase
        .from('saved_prompts')
        .insert([{
          prompt_id: promptId,
          user_id: user.id,
        }]);

      if (error) {
        return { error: error.message };
      }

      setSavedPromptIds(prev => new Set([...prev, promptId]));
    }

    return { success: true, isSaved: !isSaved };
  };

  const isSaved = (promptId: string) => {
    return savedPromptIds.has(promptId);
  };

  useEffect(() => {
    fetchSavedPrompts();
  }, [user]);

  return {
    savedPromptIds,
    loading,
    toggleSave,
    isSaved,
    refetch: fetchSavedPrompts,
  };
};
