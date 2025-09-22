import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Comment {
  id: string;
  text: string;
  user_id: string;
  prompt_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
  } | null;
}

export const useComments = (promptId?: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async (promptId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } else {
      setComments((data as any) || []);
    }
    
    setLoading(false);
  };

  const addComment = async (promptId: string, text: string, parentId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          text,
          user_id: user.id,
          prompt_id: promptId,
          parent_id: parentId || null,
        }
      ])
      .select('*')
      .single();

    if (error) {
      return { error: error.message };
    }

    setComments(prev => [...prev, (data as any)]);
    return { data };
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    setComments(prev => prev.filter(c => c.id !== commentId));
    return { success: true };
  };

  const updateComment = async (commentId: string, text: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      return { error: error.message };
    }

    setComments(prev => prev.map(c => c.id === commentId ? (data as any) : c));
    return { data };
  };

  useEffect(() => {
    if (promptId) {
      fetchComments(promptId);
    }
  }, [promptId]);

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
    updateComment,
  };
};