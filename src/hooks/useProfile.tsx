import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned, username is available
      return true;
    }
    
    return false;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: 'User not authenticated' };

    // Check username uniqueness if username is being updated
    if (updates.username && updates.username !== profile.username) {
      const isAvailable = await checkUsernameAvailability(updates.username);
      if (!isAvailable) {
        return { error: 'Username is already taken. Please choose another one.' };
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setProfile(data);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
    return { data };
  };

  const createProfile = async (username: string) => {
    if (!user) return { error: 'User not authenticated' };

    // Check username uniqueness
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      return { error: 'Username is already taken. Please choose another one.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: user.id,
          username: username,
        }
      ])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setProfile(data);
    return { data };
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    createProfile,
    checkUsernameAvailability,
    refetch: fetchProfile,
  };
};