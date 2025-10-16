import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { BarChart, Eye, Heart, MessageCircle, TrendingUp, DollarSign, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { withdrawals, totalEarnings, createWithdrawalRequest, loading: withdrawalsLoading } = useWithdrawals();
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    paidPrompts: 0,
    adRevenue: 0,
  });
  const [topPrompts, setTopPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch user's prompts with stats
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching prompts:', error);
      setLoading(false);
      return;
    }

    // Calculate stats
    const totalPrompts = prompts.length;
    const totalViews = prompts.reduce((sum, p) => sum + p.views_count, 0);
    const totalLikes = prompts.reduce((sum, p) => sum + p.likes_count, 0);
    const totalComments = prompts.reduce((sum, p) => sum + p.comments_count, 0);
    const paidPrompts = prompts.filter(p => p.is_paid).length;

    // Fetch ad revenue for earnings
    const { data: adRevenue } = await supabase
      .from('ad_revenue')
      .select('user_share')
      .eq('user_id', user.id);

    const totalAdRevenue = adRevenue ? adRevenue.reduce((sum, r) => sum + Number(r.user_share), 0) : 0;

    setStats({
      totalPrompts,
      totalViews,
      totalLikes,
      totalComments,
      paidPrompts,
      adRevenue: totalAdRevenue,
    });

    // Get top 5 prompts by views
    const top = [...prompts]
      .sort((a, b) => b.views_count - a.views_count)
      .slice(0, 5);
    setTopPrompts(top);

    setLoading(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal amount is $100",
        variant: "destructive"
      });
      return;
    }

    if (amount > totalEarnings) {
      toast({
        title: "Insufficient balance",
        description: `Your available balance is $${totalEarnings.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod || !paymentDetails) {
      toast({
        title: "Missing information",
        description: "Please provide payment method and details",
        variant: "destructive"
      });
      return;
    }

    const { error } = await createWithdrawalRequest(
      amount, 
      paymentMethod, 
      { details: paymentDetails }
    );

    if (error) {
      toast({
        title: "Withdrawal request failed",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Withdrawal request submitted",
        description: "Your request will be processed on the 13th of next month (working days only)",
      });
      setWithdrawAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      setIsWithdrawDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      completed: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">Your prompts performance and insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrompts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidPrompts} paid prompts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all prompts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Community engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                User interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ad Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.adRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Your share (50% split)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Withdrawal Management
              </span>
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={totalEarnings < 100}>
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>
                      Minimum withdrawal: $100. Processing starts on the 13th of each month (working days only).
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="100"
                        max={totalEarnings}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="100.00"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: ${totalEarnings.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Input
                        id="payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="PayPal, Bank Transfer, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-details">Payment Details</Label>
                      <Input
                        id="payment-details"
                        value={paymentDetails}
                        onChange={(e) => setPaymentDetails(e.target.value)}
                        placeholder="Email, account number, etc."
                        required
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Note:</strong> Withdrawal requests are processed on the 13th of each month (working days only). 
                        Your request will be reviewed and funds transferred within 5-7 business days after approval.
                      </AlertDescription>
                    </Alert>
                    <Button type="submit" className="w-full">
                      Submit Request
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              Track your earnings and manage withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">${Number(withdrawal.amount).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(withdrawal.requested_at).toLocaleDateString()} via {withdrawal.payment_method || 'N/A'}
                      </div>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No withdrawal requests yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Prompts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            {topPrompts.length > 0 ? (
              <div className="space-y-4">
                {topPrompts.map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <div>
                          <h4 className="font-semibold">{prompt.title}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{prompt.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {prompt.views_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {prompt.likes_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {prompt.comments_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No prompts yet. Create your first prompt to see insights!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
