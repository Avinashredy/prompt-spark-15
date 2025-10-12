import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCollections = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
    } else {
      setCollections(data || []);
    }
    
    setLoading(false);
  };

  const createCollection = async (name: string, description?: string, isPublic: boolean = false) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('collections')
      .insert([{
        name,
        description,
        is_public: isPublic,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setCollections(prev => [data, ...prev]);
    return { data };
  };

  const addPromptToCollection = async (collectionId: string, promptId: string) => {
    if (!user) return { error: 'User not authenticated' };

    // Check if prompt already exists in collection
    const { data: existing, error: checkError } = await supabase
      .from('collection_prompts')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('prompt_id', promptId)
      .maybeSingle();

    if (checkError) {
      return { error: checkError.message };
    }

    if (existing) {
      return { error: 'This prompt is already in the collection' };
    }

    const { error } = await supabase
      .from('collection_prompts')
      .insert([{
        collection_id: collectionId,
        prompt_id: promptId,
      }]);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  };

  const removePromptFromCollection = async (collectionId: string, promptId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('collection_prompts')
      .delete()
      .eq('collection_id', collectionId)
      .eq('prompt_id', promptId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  };

  const deleteCollection = async (collectionId: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    setCollections(prev => prev.filter(c => c.id !== collectionId));
    return { success: true };
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  return {
    collections,
    loading,
    createCollection,
    addPromptToCollection,
    removePromptFromCollection,
    deleteCollection,
    refetch: fetchCollections,
  };
};
