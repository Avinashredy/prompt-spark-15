import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, User, Search, Plus, BookOpen, Bookmark, Upload as UploadIcon } from 'lucide-react';

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Demo data for user's content
  const userPrompts = [
    {
      id: 1,
      title: "My Creative Assistant",
      description: "Personal writing helper for creative projects",
      category: "writing",
      likes: 45,
      comments: 12,
      createdAt: "2024-01-10",
      status: "published"
    },
    {
      id: 2,
      title: "Code Documentation Helper",
      description: "Generate clear documentation for my projects",
      category: "coding",
      likes: 23,
      comments: 5,
      createdAt: "2024-01-08",
      status: "published"
    }
  ];

  const savedPrompts = [
    {
      id: 3,
      title: "Art Style Generator",
      description: "Create unique artistic styles for image generation",
      category: "art",
      likes: 234,
      comments: 45,
      author: "pixel_artist",
      savedAt: "2024-01-12"
    },
    {
      id: 4,
      title: "Business Plan Creator",
      description: "Comprehensive business planning assistant",
      category: "business",
      likes: 156,
      comments: 32,
      author: "entrepreneur_pro",
      savedAt: "2024-01-09"
    }
  ];

  const collections = [
    {
      id: 1,
      name: "Writing Tools",
      description: "My favorite prompts for creative writing",
      promptCount: 8,
      isPublic: true,
      createdAt: "2024-01-05"
    },
    {
      id: 2,
      name: "Development Helpers",
      description: "Coding and development related prompts",
      promptCount: 12,
      isPublic: false,
      createdAt: "2024-01-03"
    }
  ];

  const filteredUserPrompts = userPrompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSavedPrompts = savedPrompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            My Library
          </h1>
          <p className="text-muted-foreground">Manage your prompts, saved content, and collections</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="my-prompts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-prompts" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              My Prompts ({userPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved ({savedPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Collections ({collections.length})
            </TabsTrigger>
          </TabsList>

          {/* My Prompts Tab */}
          <TabsContent value="my-prompts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Published Prompts</h2>
              <Button onClick={() => navigate('/upload')}>
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </div>

            {filteredUserPrompts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUserPrompts.map((prompt) => (
                  <Card key={prompt.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                        <Badge variant={prompt.status === 'published' ? 'default' : 'secondary'}>
                          {prompt.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <CardDescription>{prompt.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {prompt.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.comments}
                          </div>
                        </div>
                        <span className="text-muted-foreground">{prompt.createdAt}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share your first prompt with the community
                  </p>
                  <Button onClick={() => navigate('/upload')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Prompt
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Saved Prompts Tab */}
          <TabsContent value="saved" className="space-y-6">
            <h2 className="text-xl font-semibold">Saved Prompts</h2>

            {filteredSavedPrompts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSavedPrompts.map((prompt) => (
                  <Card key={prompt.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <CardDescription>{prompt.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {prompt.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {prompt.author}
                          </div>
                        </div>
                        <Bookmark className="h-4 w-4 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved prompts</h3>
                  <p className="text-muted-foreground mb-4">
                    Start saving prompts you find interesting
                  </p>
                  <Button variant="outline" onClick={() => navigate('/explore')}>
                    Explore Prompts
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Collections</h2>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </div>

            {filteredCollections.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection) => (
                  <Card key={collection.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={collection.isPublic ? 'default' : 'secondary'}>
                          {collection.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                      <CardDescription>{collection.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{collection.promptCount} prompts</span>
                        <span>Created {collection.createdAt}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create collections to organize your favorite prompts
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;