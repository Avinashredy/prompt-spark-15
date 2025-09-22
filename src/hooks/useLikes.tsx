import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useLikes = () => {
  const { user } = useAuth();
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchUserLikes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('likes')
      .select('prompt_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user likes:', error);
    } else {
      const likedPromptIds = new Set(data.map(like => like.prompt_id));
      setUserLikes(likedPromptIds);
    }
    
    setLoading(false);
  };

  const toggleLike = async (promptId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const isLiked = userLikes.has(promptId);

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      setUserLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert([{
          prompt_id: promptId,
          user_id: user.id,
        }]);

      if (error) {
        return { error: error.message };
      }

      setUserLikes(prev => new Set([...prev, promptId]));
    }

    return { success: true, isLiked: !isLiked };
  };

  const isLiked = (promptId: string) => {
    return userLikes.has(promptId);
  };

  useEffect(() => {
    fetchUserLikes();
  }, [user]);

  return {
    userLikes,
    loading,
    toggleLike,
    isLiked,
    refetch: fetchUserLikes,
  };
};