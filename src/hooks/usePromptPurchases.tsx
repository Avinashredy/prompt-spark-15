import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PromptPurchase {
  id: string;
  user_id: string;
  prompt_id: string;
  purchase_price: number;
  purchased_at: string;
}

export const usePromptPurchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PromptPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('prompt_purchases')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching purchases:', error);
    } else {
      setPurchases(data || []);
    }
    
    setLoading(false);
  };

  const hasPurchased = (promptId: string) => {
    return purchases.some(p => p.prompt_id === promptId);
  };

  const purchasePrompt = async (promptId: string, price: number) => {
    if (!user) return { error: 'User not authenticated' };

    // In a real app, this would integrate with a payment processor
    // For now, we'll just create the purchase record
    const { data, error } = await supabase
      .from('prompt_purchases')
      .insert([{
        user_id: user.id,
        prompt_id: promptId,
        purchase_price: price,
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setPurchases(prev => [...prev, data]);
    return { data };
  };

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  return {
    purchases,
    loading,
    hasPurchased,
    purchasePrompt,
    refetch: fetchPurchases,
  };
};
