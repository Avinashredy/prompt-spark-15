import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Search, Filter, Lock } from 'lucide-react';
import { usePrompts } from '@/hooks/usePrompts';
import { useProfile } from '@/hooks/useProfile';
import { useLikes } from '@/hooks/useLikes';
import { usePromptPurchases } from '@/hooks/usePromptPurchases';
import { useAuth } from '@/hooks/useAuth';
import { PromptDetailModal } from '@/components/PromptDetailModal';

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { prompts, loading, fetchPrompts } = usePrompts();
  const { profile } = useProfile();
  const { isLiked } = useLikes();
  const { hasPurchased } = usePromptPurchases();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'art', label: 'Art' },
    { value: 'coding', label: 'Coding' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchPrompts({
      category: selectedCategory,
      search: searchQuery
    });
  }, [selectedCategory, searchQuery]);

  const handlePromptClick = (prompt: any) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Prompts</h1>
          <p className="text-muted-foreground">Discover amazing prompts from our community</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `Showing ${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'}`}
          </p>
        </div>

        {/* Prompts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading prompts...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No prompts found matching your criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            prompts.map((prompt) => {
              const isPaidAndLocked = prompt.is_paid && !hasPurchased(prompt.id) && prompt.user_id !== user?.id;
              return (
              <Card 
                key={prompt.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
                onClick={() => handlePromptClick(prompt)}
              >
                {/* Paid Prompt Overlay */}
                {isPaidAndLocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                    <Lock className="h-12 w-12 mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">Premium Prompt</p>
                    <p className="text-sm text-muted-foreground mb-4">${prompt.price}</p>
                    <Button size="sm" variant="default">
                      Pay to Unlock
                    </Button>
                  </div>
                )}
                
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  {prompt.screenshots && prompt.screenshots.length > 0 ? (
                    <img 
                      src={prompt.screenshots[0].image_url} 
                      alt={prompt.screenshots[0].alt_text || prompt.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-muted-foreground">No preview</div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{prompt.title}</CardTitle>
                  <CardDescription>{prompt.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className={`h-4 w-4 ${isLiked(prompt.id) ? 'fill-current text-red-500' : ''}`} />
                        {prompt.likes_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {prompt.comments_count}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {prompt.profiles?.username || 'Anonymous'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })
          )}
        </div>

        <PromptDetailModal 
          prompt={selectedPrompt}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </div>
    </div>
  );
};

export default Explore;