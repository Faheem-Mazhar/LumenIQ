import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Image as ImageIcon, Clock, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PhotoSelector } from '../components/PhotoSelector';
import { MOCK_AI_CAPTIONS } from '../mockData';

interface Post {
  id: string;
  image?: string;
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled';
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onUpdatePost: (postId: string, updates: Partial<Post>) => void;
  onDeletePost: (postId: string) => void;
}

export function PostDetailModal({
  isOpen,
  onClose,
  post,
  onUpdatePost,
  onDeletePost
}: PostDetailModalProps) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(post?.image);

  // Update local state when post prop changes
  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setSelectedImage(post.image);
      
      if (post.scheduledDate) {
        const hours = post.scheduledDate.getHours().toString().padStart(2, '0');
        const minutes = post.scheduledDate.getMinutes().toString().padStart(2, '0');
        setScheduledTime(`${hours}:${minutes}`);
        
        const year = post.scheduledDate.getFullYear();
        const month = (post.scheduledDate.getMonth() + 1).toString().padStart(2, '0');
        const day = post.scheduledDate.getDate().toString().padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}`);
      }
    }
  }, [post]);

  if (!post) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const handleSaveDraft = () => {
    onUpdatePost(post.id, {
      caption,
      image: selectedImage,
      status: 'draft',
      scheduledDate: undefined
    });
    onClose();
  };

  const handleSchedulePost = () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);

    onUpdatePost(post.id, {
      caption,
      image: selectedImage,
      scheduledDate: scheduledDateTime,
      status: 'scheduled'
    });
    onClose();
  };

  const handleConvertToDraft = () => {
    if (window.confirm('Convert this scheduled post back to a draft?')) {
      onUpdatePost(post.id, {
        status: 'draft',
        scheduledDate: undefined
      });
      onClose();
    }
  };

  const handleCancelPost = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDeletePost(post.id);
      onClose();
    }
  };

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const aiCaptions = MOCK_AI_CAPTIONS;
    setCaption(aiCaptions[Math.floor(Math.random() * aiCaptions.length)]);
    setIsGeneratingCaption(false);
  };

  const handleImageSelection = (image: string) => {
    setSelectedImage(image);
    setShowPhotoSelector(false);
  };

  const isDraft = post.status === 'draft';
  const isScheduled = post.status === 'scheduled';

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
                    {isDraft ? 'Draft Post' : 'Scheduled Post'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isScheduled && post.scheduledDate 
                      ? formatDateTime(post.scheduledDate)
                      : formatDate(post.createdDate)
                    }
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
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isDraft
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-red-500/10 text-red-600 border border-red-500/30'
                    }`}
                  >
                    {isDraft ? 'Draft' : 'Scheduled'}
                  </span>
                </div>

                {/* Image Preview */}
                {selectedImage ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                    <img
                      src={selectedImage}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                    />
                    {isDraft && (
                      <button
                        onClick={() => setShowPhotoSelector(true)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="text-white font-medium">Change Photo</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {isDraft ? (
                      <button
                        onClick={() => setShowPhotoSelector(true)}
                        className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-3 group relative p-8"
                      >
                        <ImageIcon className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          Select Photo from Library
                        </span>
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-yellow-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Draft – Image Pending
                        </div>
                      </button>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}

                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
                    {isDraft && (
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
                    )}
                  </div>
                  {isDraft ? (
                    <Textarea
                      id="caption"
                      placeholder="Write your caption here..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-32 bg-input-background"
                    />
                  ) : (
                    <div className="min-h-32 bg-muted rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                      {caption || 'No caption'}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {caption.length} characters
                  </p>
                </div>

                {/* Metadata */}
                {isDraft && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Schedule Date
                      </Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="bg-input-background"
                      />
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
                )}

                {isScheduled && post.scheduledDate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Scheduled For
                    </Label>
                    <div className="text-sm text-foreground bg-muted rounded-lg p-3">
                      {formatDateTime(post.scheduledDate)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  {isScheduled && (
                    <Button
                      variant="outline"
                      onClick={handleConvertToDraft}
                      className="text-muted-foreground"
                    >
                      Convert to Draft
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCancelPost}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </Button>
                </div>
                {isDraft && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSchedulePost}
                      className="gradient-blue-primary text-white hover:opacity-90"
                    >
                      Schedule Post
                    </Button>
                  </div>
                )}
                {isScheduled && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                )}
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