import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Image as ImageIcon, Clock, Sparkles, Trash2, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PhotoSelector } from '../components/PhotoSelector';
import { MOCK_AI_CAPTIONS } from '../mockData';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled';
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  posts: Post[];
  onSavePost: (post: Partial<Post>) => void;
  onUpdatePost: (postId: string, updates: Partial<Post>) => void;
  onDeletePost: (postId: string) => void;
}

export function PostModal({
  isOpen,
  onClose,
  selectedDate,
  posts,
  onSavePost,
  onUpdatePost,
  onDeletePost
}: PostModalProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(posts[0] || null);
  const [caption, setCaption] = useState(selectedPost?.caption || '');
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [isCreatingNew, setIsCreatingNew] = useState(posts.length === 0);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(selectedPost?.images || []);
  
  // Update state when posts change
  useEffect(() => {
    if (posts.length > 0) {
      setSelectedPost(posts[0]);
      setCaption(posts[0].caption);
      setSelectedImages(posts[0].images || []);
      setIsCreatingNew(false);
    } else {
      setSelectedPost(null);
      setCaption('');
      setSelectedImages([]);
      setIsCreatingNew(true);
    }
  }, [posts]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleSaveAsDraft = () => {
    if (isCreatingNew) {
      onSavePost({
        caption,
        createdDate: new Date(),
        status: 'draft'
      });
    } else if (selectedPost) {
      onUpdatePost(selectedPost.id, {
        caption,
        status: 'draft',
        scheduledDate: undefined
      });
    }
    onClose();
  };

  const handleSchedulePost = () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes);

    if (isCreatingNew) {
      onSavePost({
        caption,
        createdDate: new Date(),
        scheduledDate: scheduledDateTime,
        status: 'scheduled'
      });
    } else if (selectedPost) {
      onUpdatePost(selectedPost.id, {
        caption,
        scheduledDate: scheduledDateTime,
        status: 'scheduled'
      });
    }
    onClose();
  };

  const handleConvertToDraft = () => {
    if (selectedPost && selectedPost.status === 'scheduled') {
      onUpdatePost(selectedPost.id, {
        status: 'draft',
        scheduledDate: undefined
      });
      setSelectedPost({ ...selectedPost, status: 'draft', scheduledDate: undefined });
    }
  };

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    // Simulate AI caption generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    const aiCaptions = MOCK_AI_CAPTIONS;
    setCaption(aiCaptions[Math.floor(Math.random() * aiCaptions.length)]);
    setIsGeneratingCaption(false);
  };

  const handleCancelPost = () => {
    if (selectedPost && window.confirm('Are you sure you want to cancel this post?')) {
      onDeletePost(selectedPost.id);
      onClose();
    }
  };

  const handleImageSelection = (image: string) => {
    setSelectedImages([...selectedImages, image]);
    if (selectedPost) {
      onUpdatePost(selectedPost.id, { images: [...selectedImages, image] });
    }
    setShowPhotoSelector(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {isCreatingNew ? 'Create Post' : 'Edit Post'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Post Selector (if multiple posts) */}
                {!isCreatingNew && posts.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setCaption(post.caption);
                        }}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all ${
                          selectedPost?.id === post.id
                            ? 'border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {post.image ? (
                          <img
                            src={post.image}
                            alt="Post preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Preview */}
                {selectedImages.length > 0 ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                    <img
                      src={selectedImages[0]}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setShowPhotoSelector(true)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="text-white font-medium">Change Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPhotoSelector(true)}
                    className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-3 group p-8"
                  >
                    <ImageIcon className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Select Photo from Library
                    </span>
                  </button>
                )}

                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCaption}
                      disabled={isGeneratingCaption}
                      className="h-8 text-xs"
                    >
                      <Sparkles className={`w-3 h-3 mr-1 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                      {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="Write your caption here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-32 bg-input-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {caption.length} characters
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created Date
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedPost 
                        ? formatDate(selectedPost.createdDate)
                        : formatDate(new Date())
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Schedule Time
                    </Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-input-background"
                    />
                  </div>
                </div>

                {/* Status Badge */}
                {selectedPost && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedPost.status === 'draft'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {selectedPost.status === 'draft' ? 'Draft' : 'Scheduled'}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  {selectedPost?.status === 'scheduled' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancelPost}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel Post
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleConvertToDraft}
                        className="text-muted-foreground"
                      >
                        Convert to Draft
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveAsDraft}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={handleSchedulePost}
                    className="gradient-blue-primary text-white hover:opacity-90"
                  >
                    Schedule Post
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photo Selector Modal - rendered last so it appears on top */}
          {showPhotoSelector && (
            <PhotoSelector
              onSelectPhoto={handleImageSelection}
              onClose={() => setShowPhotoSelector(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}