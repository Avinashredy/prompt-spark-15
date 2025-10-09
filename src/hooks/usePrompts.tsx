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
  output_url?: string | null;
  price?: number;
  is_paid?: boolean;
  profiles?: {
    username: string | null;
  } | null;
  screenshots?: {
    id: string;
    image_url: string;
    alt_text: string | null;
  }[];
  prompt_steps?: {
    id: string;
    step_number: number;
    step_text: string;
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
    
    // First, get prompts with screenshots and steps
    let query = supabase
      .from('prompts')
      .select(`
        *,
        screenshots (id, image_url, alt_text),
        prompt_steps (id, step_number, step_text)
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

    const { data: promptsData, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      setPrompts([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs to fetch profiles
    const userIds = [...new Set(promptsData?.map(p => p.user_id) || [])];
    
    // Fetch profiles for these users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', userIds);

    // Create a map of user_id to profile
    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Combine prompts with profiles
    const promptsWithProfiles = promptsData?.map(prompt => ({
      ...prompt,
      profiles: profilesMap.get(prompt.user_id) || null
    })) || [];

    setPrompts(promptsWithProfiles as any);
    setLoading(false);
  };

  const createPrompt = async (prompt: {
    title: string;
    description?: string;
    prompt_text: string;
    category: 'art' | 'coding' | 'writing' | 'marketing' | 'business' | 'education' | 'productivity' | 'entertainment' | 'other';
    output_url?: string;
    price?: number;
    is_paid?: boolean;
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
      .select('*')
      .single();

    if (error) {
      return { error: error.message };
    }

    // Add user profile to the created prompt
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, username')
      .eq('user_id', user.id)
      .single();

    const promptWithProfile = {
      ...data,
      profiles: profileData,
      screenshots: [],
      prompt_steps: []
    };

    setPrompts(prev => [promptWithProfile as any, ...prev]);
    return { data: promptWithProfile };
  };

  const createPromptSteps = async (promptId: string, steps: { step_number: number; step_text: string }[]) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('prompt_steps')
      .insert(
        steps.map(step => ({
          prompt_id: promptId,
          ...step
        }))
      )
      .select();

    if (error) {
      return { error: error.message };
    }

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
    createPromptSteps,
    deletePrompt,
    uploadScreenshot,
  };
};