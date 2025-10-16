import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  processed_at: string | null;
  payment_method: string | null;
  payment_details: any;
  notes: string | null;
}

export interface AdRevenue {
  id: string;
  user_id: string;
  prompt_id: string;
  revenue_amount: number;
  platform_share: number;
  user_share: number;
  ad_impressions: number;
  revenue_date: string;
}

export const useWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [adRevenue, setAdRevenue] = useState<AdRevenue[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch ad revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('ad_revenue')
        .select('*')
        .eq('user_id', user.id);

      if (revenueError) {
        console.error('Error fetching ad revenue:', revenueError);
      } else {
        setAdRevenue(revenueData || []);
        const total = (revenueData || []).reduce((sum, r) => sum + Number(r.user_share), 0);
        setTotalEarnings(total);
      }

      // Fetch withdrawal requests
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError);
      } else {
        setWithdrawalRequests((withdrawalsData || []) as WithdrawalRequest[]);
        
        // Calculate available balance (total - pending/approved withdrawals)
        const withdrawnAmount = (withdrawalsData || [])
          .filter(w => w.status === 'pending' || w.status === 'approved' || w.status === 'completed')
          .reduce((sum, w) => sum + Number(w.amount), 0);
        
        const total = (revenueData || []).reduce((sum, r) => sum + Number(r.user_share), 0);
        setAvailableBalance(Math.max(0, total - withdrawnAmount));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWithdrawalRequest = async (amount: number, paymentMethod: string, paymentDetails: any) => {
    if (!user) return { error: 'User not authenticated' };

    if (amount < 100) {
      return { error: 'Minimum withdrawal amount is $100' };
    }

    if (amount > availableBalance) {
      return { error: 'Insufficient balance' };
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([{
        user_id: user.id,
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    await fetchData();
    return { data };
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    withdrawalRequests,
    adRevenue,
    totalEarnings,
    availableBalance,
    loading,
    createWithdrawalRequest,
    refetch: fetchData,
  };
};
