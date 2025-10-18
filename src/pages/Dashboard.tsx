import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useMonetization } from '@/hooks/useMonetization';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Eye, Heart, MessageCircle, TrendingUp, DollarSign, Wallet, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { availableBalance, totalEarnings, withdrawalRequests, loading: withdrawalsLoading, createWithdrawalRequest } = useWithdrawals();
  const { monetizationStatus, eligibility, loading: monetizationLoading, isMonetized, requestMonetization } = useMonetization();
  
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [topPrompts, setTopPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
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

    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching prompts:', error);
      setLoading(false);
      return;
    }

    const totalPrompts = prompts.length;
    const totalViews = prompts.reduce((sum, p) => sum + p.views_count, 0);
    const totalLikes = prompts.reduce((sum, p) => sum + p.likes_count, 0);
    const totalComments = prompts.reduce((sum, p) => sum + p.comments_count, 0);

    setStats({
      totalPrompts,
      totalViews,
      totalLikes,
      totalComments,
    });

    const top = [...prompts]
      .sort((a, b) => b.views_count - a.views_count)
      .slice(0, 5);
    setTopPrompts(top);

    setLoading(false);
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal amount is $100",
        variant: "destructive"
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: `You only have $${availableBalance.toFixed(2)} available`,
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

    const { error } = await createWithdrawalRequest(amount, paymentMethod, { details: paymentDetails });

    if (error) {
      toast({
        title: "Withdrawal request failed",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request will be processed on the 13th of next month (working days only)"
      });
      setIsWithdrawDialogOpen(false);
      setWithdrawalAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
    }
  };

  const handleMonetizationRequest = async () => {
    const { error } = await requestMonetization();
    if (error) {
      toast({
        title: "Request failed",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Monetization requested",
        description: "Your request is under review. You'll be notified once approved."
      });
    }
  };

  if (loading || withdrawalsLoading || monetizationLoading) {
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
          <p className="text-muted-foreground">Your prompts performance and AdMob revenue</p>
        </div>

        {/* Monetization Status */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isMonetized ? (
                <><CheckCircle className="h-5 w-5 text-green-500" /> Monetization Active</>
              ) : monetizationStatus?.status === 'pending' ? (
                <><Clock className="h-5 w-5 text-yellow-500" /> Monetization Pending</>
              ) : monetizationStatus?.status === 'rejected' ? (
                <><XCircle className="h-5 w-5 text-red-500" /> Monetization Rejected</>
              ) : (
                <><Info className="h-5 w-5 text-muted-foreground" /> Monetization Status</>
              )}
            </CardTitle>
            <CardDescription>
              {isMonetized 
                ? "You can earn ad revenue from your prompts"
                : "Meet the requirements to start earning"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Prompts (last 30 days)</span>
                <span className={`font-semibold ${eligibility.recentPromptsCount >= eligibility.requiredPrompts ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {eligibility.recentPromptsCount} / {eligibility.requiredPrompts}
                  {eligibility.recentPromptsCount >= eligibility.requiredPrompts && <CheckCircle className="inline h-4 w-4 ml-1" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total views (last 90 days)</span>
                <span className={`font-semibold ${eligibility.totalViews >= eligibility.requiredViews ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {eligibility.totalViews.toLocaleString()} / {eligibility.requiredViews.toLocaleString()}
                  {eligibility.totalViews >= eligibility.requiredViews && <CheckCircle className="inline h-4 w-4 ml-1" />}
                </span>
              </div>
            </div>

            {!isMonetized && !monetizationStatus && eligibility.meetsRequirements && (
              <Button onClick={handleMonetizationRequest} className="w-full" size="lg">
                Request Monetization
              </Button>
            )}

            {monetizationStatus?.status === 'pending' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your monetization request is being reviewed. You'll be notified once it's approved.
                </AlertDescription>
              </Alert>
            )}

            {monetizationStatus?.status === 'rejected' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Your monetization request was rejected. {monetizationStatus.rejected_at && `Rejected on ${new Date(monetizationStatus.rejected_at).toLocaleDateString()}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

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
                Your uploaded prompts
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
              <CardTitle className="text-sm font-medium">Ad Revenue Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total earned from AdMob
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${availableBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to withdraw
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Section - Only for monetized users */}
        {isMonetized && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Withdraw Earnings</CardTitle>
              <CardDescription>Request withdrawal of your AdSense revenue (60% share after platform commission)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Withdrawal Policy:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Minimum withdrawal: $100</li>
                    <li>Processed on 13th of each month (working days only)</li>
                    <li>Revenue split: 60% to you, 40% platform</li>
                    <li>Processing: 3-5 business days</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" disabled={availableBalance < 100}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>Available: ${availableBalance.toFixed(2)}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Amount (USD)</Label>
                      <Input type="number" min="100" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="PayPal, Bank Transfer" />
                    </div>
                    <div>
                      <Label>Payment Details</Label>
                      <Input value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} placeholder="email or account" />
                    </div>
                    <Button onClick={handleWithdrawalRequest} className="w-full">Submit Request</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {withdrawalRequests.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Recent Requests</h3>
                  <div className="space-y-2">
                    {withdrawalRequests.slice(0, 5).map((req) => (
                      <div key={req.id} className="flex justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">${Number(req.amount).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{new Date(req.requested_at).toLocaleDateString()}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm">{req.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              <p className="text-center text-muted-foreground py-8">No prompts yet!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
