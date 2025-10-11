import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Eye, Heart, MessageCircle, TrendingUp, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    paidPrompts: 0,
    totalEarnings: 0,
  });
  const [topPrompts, setTopPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Fetch purchases for earnings (simplified - in real app would need proper calculations)
    const { data: purchases } = await supabase
      .from('prompt_purchases')
      .select('purchase_price')
      .in('prompt_id', prompts.map(p => p.id));

    const totalEarnings = purchases ? purchases.reduce((sum, p) => sum + Number(p.purchase_price), 0) : 0;
    const netEarnings = totalEarnings * 0.6; // After 30% commission + 10% gateway fee

    setStats({
      totalPrompts,
      totalViews,
      totalLikes,
      totalComments,
      paidPrompts,
      totalEarnings: netEarnings,
    });

    // Get top 5 prompts by views
    const top = [...prompts]
      .sort((a, b) => b.views_count - a.views_count)
      .slice(0, 5);
    setTopPrompts(top);

    setLoading(false);
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
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                After fees (60% net)
              </p>
            </CardContent>
          </Card>
        </div>

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
