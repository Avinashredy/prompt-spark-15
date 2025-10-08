import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const [totalViews, setTotalViews] = useState(0);
  const [newPrompts, setNewPrompts] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // Get total views
      const { count: viewsCount } = await supabase
        .from('prompt_views')
        .select('*', { count: 'exact', head: true });

      setTotalViews(viewsCount || 0);

      // Get new prompts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: promptsCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      setNewPrompts(promptsCount || 0);

      // Get active users (users who created prompts or engaged in last 30 days)
      const { data: recentActivity } = await supabase
        .from('prompts')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueUsers = new Set(recentActivity?.map(p => p.user_id) || []);
      setActiveUsers(uniqueUsers.size);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    totalViews,
    newPrompts,
    activeUsers,
    loading,
    refetch: fetchAnalytics,
  };
};
