import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, MessageCircle, User, ArrowLeft, Trash2, Globe, Lock } from 'lucide-react';
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

const CollectionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collection, setCollection] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCollectionDetails();
    }
  }, [id]);

  const fetchCollectionDetails = async () => {
    setLoading(true);
    
    // Fetch collection
    const { data: collectionData, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (collectionError) {
      console.error('Error fetching collection:', collectionError);
      toast({ title: "Error", description: "Failed to load collection", variant: "destructive" });
      navigate('/library');
      return;
    }

    setCollection(collectionData);

    // Fetch prompts in collection
    const { data: collectionPrompts, error: promptsError } = await supabase
      .from('collection_prompts')
      .select('prompt_id')
      .eq('collection_id', id);

    if (promptsError) {
      console.error('Error fetching collection prompts:', promptsError);
    } else if (collectionPrompts && collectionPrompts.length > 0) {
      // Fetch the actual prompts
      const promptIds = collectionPrompts.map(cp => cp.prompt_id);
      
      const { data: promptsData, error: promptsFetchError } = await supabase
        .from('prompts')
        .select(`
          *,
          profiles (username),
          screenshots (*),
          prompt_steps (*)
        `)
        .in('id', promptIds);

      if (promptsFetchError) {
        console.error('Error fetching prompts:', promptsFetchError);
      } else {
        setPrompts(promptsData || []);
      }
    }

    setLoading(false);
  };

  const handleVisibilityToggle = async (isPublic: boolean) => {
    const { error } = await supabase
      .from('collections')
      .update({ is_public: isPublic })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    } else {
      setCollection({ ...collection, is_public: isPublic });
      toast({ title: "Success", description: `Collection is now ${isPublic ? 'public' : 'private'}` });
    }
  };

  const handleDeleteCollection = async () => {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete collection", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Collection deleted" });
      navigate('/library');
    }
  };

  const handleRemovePrompt = async (promptId: string) => {
    const { error } = await supabase
      .from('collection_prompts')
      .delete()
      .eq('collection_id', id)
      .eq('prompt_id', promptId);

    if (error) {
      toast({ title: "Error", description: "Failed to remove prompt", variant: "destructive" });
    } else {
      setPrompts(prompts.filter(p => p.id !== promptId));
      toast({ title: "Success", description: "Prompt removed from collection" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const isOwner = user?.id === collection.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/library')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
              <p className="text-muted-foreground mb-4">{collection.description || 'No description'}</p>
              <div className="flex items-center gap-4">
                <Badge variant={collection.is_public ? 'default' : 'secondary'}>
                  {collection.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {collection.is_public ? 'Public' : 'Private'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
                </span>
              </div>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 mt-6 p-4 bg-muted rounded-lg">
              <Switch
                id="visibility"
                checked={collection.is_public}
                onCheckedChange={handleVisibilityToggle}
              />
              <Label htmlFor="visibility" className="cursor-pointer">
                Make this collection {collection.is_public ? 'private' : 'public'}
              </Label>
            </div>
          )}
        </div>

        {prompts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt) => (
              <Card 
                key={prompt.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow relative group"
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setIsModalOpen(true);
                }}
              >
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePrompt(prompt.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                
                {prompt.screenshots && prompt.screenshots.length > 0 && (
                  <div className="aspect-video bg-muted">
                    <img 
                      src={prompt.screenshots[0].image_url} 
                      alt={prompt.screenshots[0].alt_text || prompt.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">{prompt.category}</Badge>
                    {prompt.is_paid && <Badge variant="default">Paid</Badge>}
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
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {prompt.profiles?.username || 'Anonymous'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No prompts in this collection yet</p>
            </CardContent>
          </Card>
        )}

        <PromptDetailModal 
          prompt={selectedPrompt}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this collection? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CollectionDetail;
