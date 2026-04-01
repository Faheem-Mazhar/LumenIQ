import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Image as ImageIcon, Clock, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { MediaThumbnail, detectMediaType } from '../components/MediaThumbnail';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PhotoSelector } from '../components/PhotoSelector';
import type { RootState } from '../auth/store';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted';
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
  const [scheduledDate, setScheduledDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [isCreatingNew, setIsCreatingNew] = useState(posts.length === 0);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(selectedPost?.images || []);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeBusiness = useSelector((state: RootState) =>
    state.business.businesses.find((b) => b.isActive),
  );
  
  useEffect(() => {
    if (posts.length > 0) {
      setSelectedPost(posts[0]);
      setCaption(posts[0].caption);
      setSelectedImages(posts[0].images || []);
      setIsCreatingNew(false);
      if (posts[0].scheduledDate) {
        setScheduledDate(posts[0].scheduledDate.toISOString().split('T')[0]);
        const h = String(posts[0].scheduledDate.getHours()).padStart(2, '0');
        const m = String(posts[0].scheduledDate.getMinutes()).padStart(2, '0');
        setScheduledTime(`${h}:${m}`);
      }
    } else {
      setSelectedPost(null);
      setCaption('');
      setSelectedImages([]);
      setIsCreatingNew(true);
    }
  }, [posts]);

  useEffect(() => {
    setScheduledDate(selectedDate.toISOString().split('T')[0]);
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) setConfirmCancelOpen(false);
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleSaveAsDraft = async () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const draftDateTime = new Date(scheduledDate + 'T00:00:00');
    draftDateTime.setHours(hours, minutes);

    setIsSaving(true);
    try {
      if (isCreatingNew) {
        await onSavePost({
          caption,
          images: selectedImages.length > 0 ? selectedImages : undefined,
          createdDate: new Date(),
          scheduledDate: draftDateTime,
          status: 'draft'
        });
      } else if (selectedPost) {
        await onUpdatePost(selectedPost.id, {
          caption,
          images: selectedImages.length > 0 ? selectedImages : undefined,
          status: 'draft',
          scheduledDate: draftDateTime
        });
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedulePost = async () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduledDate + 'T00:00:00');
    scheduledDateTime.setHours(hours, minutes);

    setIsSaving(true);
    try {
      if (isCreatingNew) {
        await onSavePost({
          caption,
          images: selectedImages.length > 0 ? selectedImages : undefined,
          createdDate: new Date(),
          scheduledDate: scheduledDateTime,
          status: 'scheduled'
        });
      } else if (selectedPost) {
        await onUpdatePost(selectedPost.id, {
          caption,
          images: selectedImages.length > 0 ? selectedImages : undefined,
          scheduledDate: scheduledDateTime,
          status: 'scheduled'
        });
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToDraft = () => {
    if (selectedPost && selectedPost.status === 'scheduled') {
      onUpdatePost(selectedPost.id, {
        status: 'draft'
      });
      setSelectedPost({ ...selectedPost, status: 'draft' });
    }
  };

  const handleCancelPostClick = () => {
    if (selectedPost) setConfirmCancelOpen(true);
  };

  const confirmCancelPost = () => {
    if (selectedPost) {
      onDeletePost(selectedPost.id);
      onClose();
    }
    setConfirmCancelOpen(false);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

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
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {isCreatingNew ? 'Create Post' : 'Edit Post'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(new Date(scheduledDate + 'T00:00:00'))}
                  </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isCreatingNew && posts.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          setSelectedPost(post);
                          setCaption(post.caption);
                          setSelectedImages(post.images || []);
                        }}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all ${
                          selectedPost?.id === post.id ? 'border-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {post.images && post.images.length > 0 ? (
                          <MediaThumbnail src={post.images[0]} alt="Post preview" mediaType={detectMediaType(post.images[0])} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedImages.length > 0 ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                    <MediaThumbnail src={selectedImages[0]} alt="Post preview" mediaType={detectMediaType(selectedImages[0])} className="w-full h-full object-cover" />
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="Write your caption here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-32 bg-input-background"
                  />
                  <p className="text-xs text-muted-foreground">{caption.length} characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Date
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
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

                {selectedPost && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPost.status === 'draft' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {selectedPost.status === 'draft' ? 'Draft' : 'Scheduled'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
              <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created Date
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedPost ? formatDate(selectedPost.createdDate) : formatDate(new Date())}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPost?.status === 'scheduled' && (
                    <>
                      <Button variant="outline" onClick={handleCancelPostClick} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel Post
                      </Button>
                      <Button variant="outline" onClick={handleConvertToDraft} className="text-muted-foreground">
                        Convert to Draft
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleSaveAsDraft} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save as Draft'}
                  </Button>
                  <Button onClick={handleSchedulePost} disabled={isSaving} className="gradient-blue-primary text-white hover:opacity-90">
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : 'Schedule Post'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {showPhotoSelector && (
            <PhotoSelector
              onSelectPhoto={handleImageSelection}
              onClose={() => setShowPhotoSelector(false)}
            />
          )}

          <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the scheduled post. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep post</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmCancelPost}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Remove post
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
}
