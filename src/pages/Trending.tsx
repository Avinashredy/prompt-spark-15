import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, User, TrendingUp, Clock, Flame } from 'lucide-react';

const Trending = () => {
  const [timeframe, setTimeframe] = useState('week');

  // Demo data for trending prompts
  const trendingPrompts = [
    {
      id: 1,
      title: "Creative Writing Assistant",
      description: "Generate compelling stories with rich character development and engaging plots that captivate readers",
      category: "writing",
      likes: 342,
      comments: 67,
      author: "storyteller_ai",
      screenshot: "/placeholder.svg",
      trend: "+125%",
      rank: 1
    },
    {
      id: 2,
      title: "Art Style Descriptor",
      description: "Describe artistic styles and techniques for AI image generation with precise vocabulary",
      category: "art",
      likes: 289,
      comments: 54,
      author: "pixel_artist",
      screenshot: "/placeholder.svg",
      trend: "+98%",
      rank: 2
    },
    {
      id: 3,
      title: "Code Review Expert",
      description: "Comprehensive code analysis and improvement suggestions for better software quality",
      category: "coding",
      likes: 234,
      comments: 43,
      author: "dev_master",
      screenshot: "/placeholder.svg",
      trend: "+87%",
      rank: 3
    },
    {
      id: 4,
      title: "Marketing Copy Generator",
      description: "Create engaging marketing content that converts visitors into customers effectively",
      category: "marketing",
      likes: 198,
      comments: 38,
      author: "growth_hacker",
      screenshot: "/placeholder.svg",
      trend: "+76%",
      rank: 4
    },
    {
      id: 5,
      title: "Business Plan Generator",
      description: "Create comprehensive business plans with financial projections and market analysis",
      category: "business",
      likes: 167,
      comments: 29,
      author: "entrepreneur_pro",
      screenshot: "/placeholder.svg",
      trend: "+65%",
      rank: 5
    },
    {
      id: 6,
      title: "Educational Content Creator",
      description: "Design engaging educational materials and lesson plans for effective learning",
      category: "education",
      likes: 145,
      comments: 25,
      author: "edu_innovator",
      screenshot: "/placeholder.svg",
      trend: "+54%",
      rank: 6
    }
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-400";
    return "text-muted-foreground";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Flame className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Trending Prompts
          </h1>
          <p className="text-muted-foreground">Discover what's hot in the community right now</p>
        </div>

        {/* Time filters */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-8">
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Trending Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">2.4M</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-green-500 mt-2">+12% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Prompts</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-orange-500 mt-2">+23% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">8.9K</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-blue-500 mt-2">+8% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Trending Prompts */}
        <div className="space-y-6">
          {trendingPrompts.map((prompt, index) => (
            <Card key={prompt.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 aspect-video md:aspect-square bg-muted flex items-center justify-center">
                  <img 
                    src={prompt.screenshot} 
                    alt={prompt.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 font-bold text-lg ${getRankColor(prompt.rank)}`}>
                          {getRankIcon(prompt.rank)}
                          #{prompt.rank}
                        </div>
                        <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                        <Badge variant="outline" className="text-green-600">
                          {prompt.trend}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{prompt.title}</CardTitle>
                    <CardDescription className="text-base">{prompt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{prompt.likes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{prompt.comments}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{prompt.author}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-12">
          <Button variant="outline">
            Load More Trending Prompts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Trending;