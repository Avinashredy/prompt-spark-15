import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  processed_at?: string;
  payment_method?: string;
  payment_details?: any;
  notes?: string;
}

export const useWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const fetchWithdrawals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
    } else {
      setWithdrawals((data || []) as WithdrawalRequest[]);
    }
    
    setLoading(false);
  };

  const fetchTotalEarnings = async () => {
    if (!user) return;

    // Calculate total earnings from ad revenue
    const { data: adRevenue, error } = await supabase
      .from('ad_revenue')
      .select('user_share')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching ad revenue:', error);
      return;
    }

    const total = adRevenue?.reduce((sum, record) => sum + Number(record.user_share), 0) || 0;

    // Subtract already withdrawn amounts
    const { data: withdrawnData } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('user_id', user.id)
      .in('status', ['completed', 'approved', 'pending']);

    const withdrawn = withdrawnData?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

    setTotalEarnings(total - withdrawn);
  };

  const createWithdrawalRequest = async (amount: number, paymentMethod: string, paymentDetails: any) => {
    if (!user) return { error: 'User not authenticated' };

    if (amount < 100) {
      return { error: 'Minimum withdrawal amount is $100' };
    }

    if (amount > totalEarnings) {
      return { error: 'Insufficient balance' };
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert([{
        user_id: user.id,
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setWithdrawals(prev => [data as WithdrawalRequest, ...prev]);
    await fetchTotalEarnings();
    return { data };
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchTotalEarnings();
  }, [user]);

  return {
    withdrawals,
    loading,
    totalEarnings,
    createWithdrawalRequest,
    refetch: () => {
      fetchWithdrawals();
      fetchTotalEarnings();
    },
  };
};
