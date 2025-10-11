import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, User, Calendar, Copy, Trash2, Bookmark, FolderPlus, Lock, ExternalLink } from 'lucide-react';
import { Prompt } from '@/hooks/usePrompts';
import { useLikes } from '@/hooks/useLikes';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { useCollections } from '@/hooks/useCollections';
import { usePromptViews } from '@/hooks/usePromptViews';
import { usePromptPurchases } from '@/hooks/usePromptPurchases';
import { CreateCollectionDialog } from './CreateCollectionDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptDetailModal = ({ prompt, open, onOpenChange }: PromptDetailModalProps) => {
  const { user } = useAuth();
  const { toggleLike, isLiked } = useLikes();
  const { comments, addComment, deleteComment, loading: commentsLoading } = useComments(prompt?.id);
  const { toggleSave, isSaved } = useSavedPrompts();
  const { collections, addPromptToCollection } = useCollections();
  const { trackView } = usePromptViews();
  const { hasPurchased, purchasePrompt } = usePromptPurchases();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Track view when modal opens
  useEffect(() => {
    if (prompt && open) {
      trackView(prompt.id);
    }
  }, [prompt, open]);

  const handleLike = async () => {
    if (!prompt || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like prompts.",
        variant: "destructive",
      });
      return;
    }

    const result = await toggleLike(prompt.id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!prompt || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save prompts.",
        variant: "destructive",
      });
      return;
    }

    const result = await toggleSave(prompt.id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: result.isSaved ? "Saved!" : "Removed",
        description: result.isSaved 
          ? "Prompt saved to your library." 
          : "Prompt removed from your library.",
      });
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!prompt || !user) return;

    const result = await addPromptToCollection(collectionId, prompt.id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Added to collection",
        description: "Prompt added to your collection.",
      });
    }
  };

  const handlePurchasePrompt = async () => {
    if (!prompt || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to purchase prompts.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    const result = await purchasePrompt(prompt.id, prompt.price || 0);
    
    if (result.error) {
      toast({
        title: "Purchase failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Purchase successful!",
        description: "You now have access to this prompt.",
      });
    }
    setIsPurchasing(false);
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    
    navigator.clipboard.writeText(prompt.prompt_text);
    toast({
      title: "Copied!",
      description: "Prompt text copied to clipboard.",
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt || !user || !newComment.trim()) return;

    setIsSubmittingComment(true);
    const result = await addComment(prompt.id, newComment.trim());
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setNewComment('');
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    }
    
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteComment(commentId);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    }
  };

  if (!prompt) return null;

  const liked = isLiked(prompt.id);
  const saved = isSaved(prompt.id);
  const isPaid = prompt.is_paid && prompt.user_id !== user?.id;
  const purchased = hasPurchased(prompt.id);
  const canViewContent = !isPaid || purchased || prompt.user_id === user?.id;

  return (
    <>
      <CreateCollectionDialog 
        open={showCreateCollection} 
        onOpenChange={setShowCreateCollection}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{prompt.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {prompt.category}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {prompt.profiles?.username || 'Anonymous'}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={liked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="flex items-center gap-1"
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {prompt.likes_count}
              </Button>
              <Button
                variant={saved ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1"
              >
                <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <FolderPlus className="h-4 w-4" />
                    Add to Collection
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {collections.length === 0 ? (
                    <DropdownMenuItem onClick={() => setShowCreateCollection(true)}>
                      Create your first collection
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {collections.map((collection) => (
                        <DropdownMenuItem
                          key={collection.id}
                          onClick={() => handleAddToCollection(collection.id)}
                        >
                          {collection.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => setShowCreateCollection(true)}>
                        + Create new collection
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Screenshots */}
          {prompt.screenshots && prompt.screenshots.length > 0 && (
            <div className="flex-shrink-0 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompt.screenshots.map((screenshot) => (
                  <img
                    key={screenshot.id}
                    src={screenshot.image_url}
                    alt={screenshot.alt_text || prompt.title}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {prompt.description && (
            <div className="flex-shrink-0 mb-4">
              <p className="text-muted-foreground">{prompt.description}</p>
            </div>
          )}

          {/* Pricing Info */}
          {isPaid && (
            <div className="flex-shrink-0 mb-4">
              <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Paid Prompt</p>
                    <p className="text-sm text-muted-foreground">
                      Price: ${prompt.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
                {!purchased && (
                  <Button 
                    onClick={handlePurchasePrompt}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? 'Processing...' : 'Purchase Access'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Output URL */}
          {prompt.output_url && canViewContent && (
            <div className="flex-shrink-0 mb-4">
              <a 
                href={prompt.output_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View Example Output
              </a>
            </div>
          )}

          {/* Prompt Text */}
          {canViewContent ? (
            <div className="flex-shrink-0 mb-6">
              <h3 className="font-semibold mb-2">Prompt</h3>
              {prompt.prompt_steps && prompt.prompt_steps.length > 0 ? (
                <div className="space-y-4">
                  {prompt.prompt_steps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step) => (
                      <div key={step.id} className="bg-muted p-4 rounded-lg relative group">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">Step {step.step_number}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(step.step_text);
                              toast({ title: "Copied!", description: `Step ${step.step_number} copied to clipboard` });
                            }}
                            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm font-mono">{step.step_text}</pre>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{prompt.prompt_text}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-shrink-0 mb-6">
              <div className="bg-muted p-8 rounded-lg text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Purchase Required</p>
                <p className="text-muted-foreground">
                  Purchase this prompt to view the full content
                </p>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Comments Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Comments ({prompt.comments_count})</h3>
            </div>

            {/* Add Comment Form */}
            {user && (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 min-h-[80px]"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmittingComment || !newComment.trim()}
                    size="sm"
                  >
                    Post
                  </Button>
                </div>
              </form>
            )}

            {/* Comments List with Scroll */}
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
              {commentsLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>
                        {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {user && comment.user_id === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};