import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Search, Filter } from 'lucide-react';

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Demo data for prompts
  const prompts = [
    {
      id: 1,
      title: "Creative Writing Assistant",
      description: "Generate compelling stories with rich character development and engaging plots",
      category: "writing",
      likes: 142,
      comments: 28,
      author: "storyteller_ai",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Code Review Expert",
      description: "Comprehensive code analysis and improvement suggestions for better software quality",
      category: "coding",
      likes: 89,
      comments: 15,
      author: "dev_master",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-12"
    },
    {
      id: 3,
      title: "Marketing Copy Generator",
      description: "Create engaging marketing content that converts visitors into customers",
      category: "marketing",
      likes: 67,
      comments: 12,
      author: "growth_hacker",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-10"
    },
    {
      id: 4,
      title: "Art Style Descriptor",
      description: "Describe artistic styles and techniques for AI image generation",
      category: "art",
      likes: 234,
      comments: 45,
      author: "pixel_artist",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-08"
    },
    {
      id: 5,
      title: "Business Plan Generator",
      description: "Create comprehensive business plans with financial projections",
      category: "business",
      likes: 156,
      comments: 32,
      author: "entrepreneur_pro",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-05"
    },
    {
      id: 6,
      title: "Educational Content Creator",
      description: "Design engaging educational materials and lesson plans",
      category: "education",
      likes: 98,
      comments: 21,
      author: "edu_innovator",
      screenshot: "/placeholder.svg",
      createdAt: "2024-01-03"
    }
  ];

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

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            Showing {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
          </p>
        </div>

        {/* Prompts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
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
                  <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
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

        {/* Empty state */}
        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No prompts found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;