import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MonetizationStatus {
  id: string;
  user_id: string;
  is_monetized: boolean;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export interface EligibilityRequirements {
  meetsRequirements: boolean;
  recentPromptsCount: number;
  totalViews: number;
  requiredPrompts: number;
  requiredViews: number;
}

export const useMonetization = () => {
  const { user } = useAuth();
  const [monetizationStatus, setMonetizationStatus] = useState<MonetizationStatus | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityRequirements>({
    meetsRequirements: false,
    recentPromptsCount: 0,
    totalViews: 0,
    requiredPrompts: 5,
    requiredViews: 100000,
  });
  const [loading, setLoading] = useState(true);

  const fetchMonetizationStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch monetization status
      const { data: statusData, error: statusError } = await supabase
        .from('user_monetization')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statusError && statusError.code !== 'PGRST116') {
        console.error('Error fetching monetization status:', statusError);
      } else {
        setMonetizationStatus(statusData as MonetizationStatus | null);
      }

      // Calculate eligibility
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Count prompts in last 30 days
      const { count: recentPromptsCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get total views in last 90 days
      const { data: promptsData } = await supabase
        .from('prompts')
        .select('id, views_count')
        .eq('user_id', user.id)
        .gte('created_at', ninetyDaysAgo.toISOString());

      const totalViews = (promptsData || []).reduce((sum, p) => sum + (p.views_count || 0), 0);

      const meetsRequirements = (recentPromptsCount || 0) >= 5 && totalViews >= 100000;

      setEligibility({
        meetsRequirements,
        recentPromptsCount: recentPromptsCount || 0,
        totalViews,
        requiredPrompts: 5,
        requiredViews: 100000,
      });
    } catch (error) {
      console.error('Error fetching monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestMonetization = async () => {
    if (!user) return { error: 'User not authenticated' };

    if (!eligibility.meetsRequirements) {
      return { error: 'Does not meet eligibility requirements' };
    }

    const { data, error } = await supabase
      .from('user_monetization')
      .insert([{
        user_id: user.id,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    await fetchMonetizationStatus();
    return { data };
  };

  useEffect(() => {
    fetchMonetizationStatus();
  }, [user]);

  return {
    monetizationStatus,
    eligibility,
    loading,
    isMonetized: monetizationStatus?.is_monetized || false,
    requestMonetization,
    refetch: fetchMonetizationStatus,
  };
};
