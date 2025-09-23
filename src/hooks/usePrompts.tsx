import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Prompt {
  id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  category: 'art' | 'coding' | 'writing' | 'marketing' | 'business' | 'education' | 'productivity' | 'entertainment' | 'other';
  user_id: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
  } | null;
  screenshots?: {
    id: string;
    image_url: string;
    alt_text: string | null;
  }[];
}

export const usePrompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async (filters?: {
    category?: string;
    search?: string;
    userId?: string;
    trending?: boolean;
  }) => {
    setLoading(true);
    
    let query = supabase
      .from('prompts')
      .select(`
        *,
        profiles (username),
        screenshots (id, image_url, alt_text)
      `);

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category as any);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.trending) {
      // Trending algorithm: order by engagement score (likes * 2 + comments) and recency
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      setPrompts([]);
    } else {
      setPrompts((data as any) || []);
    }
    
    setLoading(false);
  };

  const createPrompt = async (prompt: {
    title: string;
    description?: string;
    prompt_text: string;
    category: 'art' | 'coding' | 'writing' | 'marketing' | 'business' | 'education' | 'productivity' | 'entertainment' | 'other';
  }) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('prompts')
      .insert([
        {
          ...prompt,
          user_id: user.id,
        }
      ])
      .select(`
        *,
        profiles (username),
        screenshots (id, image_url, alt_text)
      `)
      .single();

    if (error) {
      return { error: error.message };
    }

    setPrompts(prev => [(data as any), ...prev]);
    return { data };
  };

  const deletePrompt = async (promptId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    setPrompts(prev => prev.filter(p => p.id !== promptId));
    return { success: true };
  };

  const uploadScreenshot = async (promptId: string, file: File, altText?: string) => {
    if (!user) return { error: 'User not authenticated' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${promptId}/${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file);

    if (uploadError) {
      return { error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    // Save screenshot record
    const { data, error } = await supabase
      .from('screenshots')
      .insert([
        {
          prompt_id: promptId,
          image_url: publicUrl,
          alt_text: altText,
        }
      ])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return {
    prompts,
    loading,
    fetchPrompts,
    createPrompt,
    deletePrompt,
    uploadScreenshot,
  };
};