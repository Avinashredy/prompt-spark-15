import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePrompts } from '@/hooks/usePrompts';
import { useLikes } from '@/hooks/useLikes';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { useCollections } from '@/hooks/useCollections';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, User, Search, Plus, BookOpen, Bookmark, Upload as UploadIcon, Trash2, Edit } from 'lucide-react';
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog';
import { PromptDetailModal } from '@/components/PromptDetailModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const { prompts, loading, fetchPrompts, deletePrompt } = usePrompts();
  const { savedPromptIds } = useSavedPrompts();
  const { userLikes } = useLikes();
  const { collections } = useCollections();

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  // Filter prompts
  const filteredUserPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    prompt.user_id === user?.id
  );

  const savedPrompts = prompts.filter(prompt => 
    savedPromptIds.has(prompt.id) &&
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const likedPrompts = prompts.filter(prompt => 
    userLikes.has(prompt.id) &&
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePrompt = async (promptId: string) => {
    const result = await deletePrompt(promptId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Prompt deleted successfully" });
      fetchPrompts();
    }
    setPromptToDelete(null);
  };

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
              My Prompts ({filteredUserPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved ({savedPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Liked ({likedPrompts.length})
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

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your prompts...</p>
              </div>
            ) : filteredUserPrompts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUserPrompts.map((prompt) => (
                  <Card 
                    key={prompt.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow relative group"
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setIsModalOpen(true);
                    }}
                  >
                    {/* Delete and Edit buttons */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/upload?edit=${prompt.id}`);
                        }}
                        className="h-8"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPromptToDelete(prompt.id);
                        }}
                        className="h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                        <Badge variant="default">Published</Badge>
                      </div>
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <CardDescription>{prompt.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {prompt.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.comments_count}
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
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

            {savedPrompts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPrompts.map((prompt) => (
                  <Card 
                    key={prompt.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setIsModalOpen(true);
                    }}
                  >
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
                            {prompt.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.comments_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {prompt.profiles?.username || 'Anonymous'}
                          </div>
                        </div>
                        <Bookmark className="h-4 w-4 text-primary fill-current" />
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

          {/* Liked Prompts Tab */}
          <TabsContent value="liked" className="space-y-6">
            <h2 className="text-xl font-semibold">Liked Prompts</h2>

            {likedPrompts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedPrompts.map((prompt) => (
                  <Card 
                    key={prompt.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setIsModalOpen(true);
                    }}
                  >
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
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                            {prompt.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {prompt.comments_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {prompt.profiles?.username || 'Anonymous'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No liked prompts</h3>
                  <p className="text-muted-foreground mb-4">
                    Start liking prompts you find interesting
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
              <Button onClick={() => setIsCreateCollectionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </div>

            {filteredCollections.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection) => (
                  <Card 
                    key={collection.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/collection/${collection.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={collection.is_public ? 'default' : 'secondary'}>
                          {collection.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                      <CardDescription>{collection.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
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
                  <Button onClick={() => setIsCreateCollectionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateCollectionDialog 
        open={isCreateCollectionOpen}
        onOpenChange={setIsCreateCollectionOpen}
      />

      <PromptDetailModal 
        prompt={selectedPrompt}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <AlertDialog open={!!promptToDelete} onOpenChange={(open) => !open && setPromptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => promptToDelete && handleDeletePrompt(promptToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Library;