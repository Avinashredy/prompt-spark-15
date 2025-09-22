import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, User, Sparkles, TrendingUp, Zap } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Demo data for trending prompts
  const trendingPrompts = [
    {
      id: 1,
      title: "Creative Writing Assistant",
      description: "Generate compelling stories with rich character development",
      category: "writing",
      likes: 142,
      comments: 28,
      author: "storyteller_ai",
      screenshot: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Code Review Expert",
      description: "Comprehensive code analysis and improvement suggestions",
      category: "coding",
      likes: 89,
      comments: 15,
      author: "dev_master",
      screenshot: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Marketing Copy Generator",
      description: "Create engaging marketing content that converts",
      category: "marketing",
      likes: 67,
      comments: 12,
      author: "growth_hacker",
      screenshot: "/placeholder.svg"
    }
  ];

  const categories = [
    { name: "Art", icon: Sparkles, count: 234 },
    { name: "Coding", icon: Zap, count: 189 },
    { name: "Writing", icon: MessageCircle, count: 156 },
    { name: "Marketing", icon: TrendingUp, count: 98 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Discover Amazing AI Prompts
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Share your best prompts, explore what others have created, and get inspired by the community's creativity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" onClick={() => navigate('/upload')}>
                Share Your Prompt
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={() => navigate('/explore')}>
              Explore Library
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/explore?category=${category.name.toLowerCase()}`)}
              >
                <CardContent className="p-6 text-center">
                  <category.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} prompts</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Prompts */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">Trending This Week</h2>
            <Button variant="outline" onClick={() => navigate('/trending')}>
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPrompts.map((prompt) => (
              <Card key={prompt.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <img 
                    src={prompt.screenshot} 
                    alt={prompt.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{prompt.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{prompt.title}</CardTitle>
                  <CardDescription>{prompt.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {prompt.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {prompt.comments}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {prompt.author}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 px-4 bg-primary/5">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Join the Community</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Share your prompts, discover new ideas, and connect with creators worldwide.
            </p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              Sign Up Now
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
