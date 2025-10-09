import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePrompts } from '@/hooks/usePrompts';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload as UploadIcon, Image, X, Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPrompt, createPromptSteps, uploadScreenshot } = usePrompts();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promptText: '',
    category: '',
    tags: [] as string[],
    outputUrl: '',
    price: '',
    isPaid: false,
  });
  const [promptType, setPromptType] = useState<'single' | 'stepwise'>('single');
  const [promptSteps, setPromptSteps] = useState<{ step_number: number; step_text: string }[]>([
    { step_number: 1, step_text: '' }
  ]);
  const [currentTag, setCurrentTag] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { value: 'art', label: 'Art & Design' },
    { value: 'coding', label: 'Coding & Development' },
    { value: 'writing', label: 'Writing & Content' },
    { value: 'marketing', label: 'Marketing & Sales' },
    { value: 'business', label: 'Business & Strategy' },
    { value: 'education', label: 'Education & Learning' },
    { value: 'productivity', label: 'Productivity & Tools' },
    { value: 'entertainment', label: 'Entertainment & Fun' },
    { value: 'other', label: 'Other' }
  ];

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScreenshots(prev => [...prev, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const addPromptStep = () => {
    setPromptSteps(prev => [
      ...prev,
      { step_number: prev.length + 1, step_text: '' }
    ]);
  };

  const updatePromptStep = (index: number, text: string) => {
    setPromptSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, step_text: text } : step
    ));
  };

  const removePromptStep = (index: number) => {
    if (promptSteps.length > 1) {
      setPromptSteps(prev => 
        prev.filter((_, i) => i !== index)
          .map((step, i) => ({ ...step, step_number: i + 1 }))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promptTextToValidate = promptType === 'single' 
      ? formData.promptText 
      : promptSteps.every(step => step.step_text.trim());

    if (!formData.title || !promptTextToValidate || !formData.category) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.isPaid && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please set a valid price for paid prompts.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create the prompt in the database
      const { data: newPrompt, error } = await createPrompt({
        title: formData.title,
        description: formData.description || undefined,
        prompt_text: promptType === 'single' ? formData.promptText : 'See step-by-step instructions',
        category: formData.category as any,
        output_url: formData.outputUrl || undefined,
        price: formData.isPaid ? parseFloat(formData.price) : 0,
        is_paid: formData.isPaid,
      });
      
      if (error) {
        throw new Error(error);
      }

      // If stepwise prompts, create the steps
      if (promptType === 'stepwise' && newPrompt) {
        const stepsResult = await createPromptSteps(newPrompt.id, promptSteps);
        if (stepsResult.error) {
          throw new Error(stepsResult.error);
        }
      }
      
      // Upload screenshots if any
      if (screenshots.length > 0 && newPrompt) {
        for (const [index, file] of screenshots.entries()) {
          await uploadScreenshot(newPrompt.id, file, `Screenshot ${index + 1} for ${formData.title}`);
        }
      }
      
      toast({
        title: "Prompt uploaded successfully!",
        description: "Your prompt is now live and available to the community.",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        promptText: '',
        category: '',
        tags: [],
        outputUrl: '',
        price: '',
        isPaid: false,
      });
      setPromptSteps([{ step_number: 1, step_text: '' }]);
      setScreenshots([]);
      setPromptType('single');
      
      // Navigate to explore page
      navigate('/explore');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Share Your Prompt</h1>
          <p className="text-muted-foreground">Help others discover amazing AI prompts by sharing your creations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Give your prompt a catchy title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your prompt does and how to use it"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
            </CardContent>
          </Card>

          {/* Prompt Content */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Content</CardTitle>
              <CardDescription>Share the actual prompt text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Prompt Type</Label>
                <Select value={promptType} onValueChange={(value: 'single' | 'stepwise') => setPromptType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Prompt</SelectItem>
                    <SelectItem value="stepwise">Step-by-Step Prompts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {promptType === 'single' ? (
                <div>
                  <Label htmlFor="promptText">Prompt Text *</Label>
                  <Textarea
                    id="promptText"
                    value={formData.promptText}
                    onChange={(e) => handleInputChange('promptText', e.target.value)}
                    placeholder="Paste your prompt here..."
                    rows={8}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Tip: Include placeholders like [TOPIC] or [STYLE] for variables users can customize
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Prompt Steps *</Label>
                  {promptSteps.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Step {step.step_number}</Label>
                        {promptSteps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePromptStep(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={step.step_text}
                        onChange={(e) => updatePromptStep(index, e.target.value)}
                        placeholder={`Enter step ${step.step_number} instructions...`}
                        rows={4}
                        required
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPromptStep}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Step
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="outputUrl">Output URL (Optional)</Label>
                <Input
                  id="outputUrl"
                  value={formData.outputUrl}
                  onChange={(e) => handleInputChange('outputUrl', e.target.value)}
                  placeholder="https://example.com/output"
                  type="url"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Link to example output or result
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set pricing for your prompt (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPaid">Make this a paid prompt</Label>
                  <p className="text-sm text-muted-foreground">
                    Charge users to access this prompt
                  </p>
                </div>
                <Switch
                  id="isPaid"
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPaid: checked }))
                  }
                />
              </div>

              {formData.isPaid && (
                <>
                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="9.99"
                      required={formData.isPaid}
                    />
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Commission Structure:</strong> We take 30% platform commission + 10% payment gateway fee. 
                      You'll receive {formData.price ? `$${(parseFloat(formData.price) * 0.6).toFixed(2)}` : '$0.00'} per sale.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to help others discover your prompt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Screenshots */}
          <Card>
            <CardHeader>
              <CardTitle>Screenshots</CardTitle>
              <CardDescription>Upload example outputs or screenshots (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                    <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Click to upload screenshots or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </label>
                </div>
                
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {screenshots.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeScreenshot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Share Prompt
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/explore')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;