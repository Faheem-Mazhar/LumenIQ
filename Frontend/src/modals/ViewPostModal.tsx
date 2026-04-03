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
import { X, Calendar, Image as ImageIcon, Clock, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { MediaThumbnail, detectMediaType } from '../components/MediaThumbnail';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PhotoSelector } from '../components/PhotoSelector';
import type { RootState } from '../auth/store';
import { toast } from 'sonner';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted';
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
  const [selectedImages, setSelectedImages] = useState<string[]>(post?.images || []);
  const [confirmAction, setConfirmAction] = useState<null | 'convertToDraft' | 'deletePost'>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeBusiness = useSelector((state: RootState) =>
    state.business.businesses.find((b) => b.isActive),
  );

  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setSelectedImages(post.images || []);
      
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

  useEffect(() => {
    if (!isOpen) setConfirmAction(null);
  }, [isOpen]);

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

  const handleSaveDraft = async () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const draftDateTime = new Date(year, month - 1, day, hours, minutes);

    setIsSaving(true);
    try {
      await onUpdatePost(post.id, {
        caption,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        status: 'draft',
        scheduledDate: draftDateTime
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedulePost = async () => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);

    if (scheduledDateTime <= new Date()) {
      toast.error('Cannot schedule a post in the past');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdatePost(post.id, {
        caption,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        scheduledDate: scheduledDateTime,
        status: 'scheduled'
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToDraftClick = () => setConfirmAction('convertToDraft');

  const handleDeletePostClick = () => setConfirmAction('deletePost');

  const executeConfirmAction = async () => {
    setIsSaving(true);
    try {
      if (confirmAction === 'convertToDraft') {
        await onUpdatePost(post.id, { status: 'draft' });
        onClose();
      } else if (confirmAction === 'deletePost') {
        await onDeletePost(post.id);
        onClose();
      }
    } finally {
      setIsSaving(false);
      setConfirmAction(null);
    }
  };

  const handleImageSelection = (image: string) => {
    setSelectedImages(prev => [...prev, image]);
    setShowPhotoSelector(false);
  };

  const isDraft = post.status === 'draft';
  const isScheduled = post.status === 'scheduled';
  const isPosted = post.status === 'posted';
  const displayImage = selectedImages.length > 0 ? selectedImages[0] : undefined;

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
                    {isDraft ? 'Draft Post' : isPosted ? 'Posted' : 'Scheduled Post'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(isScheduled || isPosted) && post.scheduledDate
                      ? formatDateTime(post.scheduledDate)
                      : formatDate(post.createdDate)
                    }
                  </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    isDraft
                      ? 'bg-muted text-muted-foreground'
                      : isPosted
                        ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                        : 'bg-red-500/10 text-red-600 border border-red-500/30'
                  }`}>
                    {isDraft ? 'Draft' : isPosted ? 'Posted' : 'Scheduled'}
                  </span>
                </div>

                {displayImage ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                    <MediaThumbnail
                      src={displayImage}
                      alt="Post preview"
                      mediaType={detectMediaType(displayImage)}
                      className="w-full h-full object-cover"
                      controls={detectMediaType(displayImage) === 'video'}
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption">Caption</Label>
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
                  <p className="text-xs text-muted-foreground">{caption.length} characters</p>
                </div>

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
                )}

                {(isScheduled || isPosted) && post.scheduledDate && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {isPosted ? 'Posted On' : 'Scheduled For'}
                    </Label>
                    <div className="text-sm text-foreground bg-muted rounded-lg p-3">
                      {formatDateTime(post.scheduledDate)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  {isScheduled && (
                    <Button variant="outline" onClick={handleConvertToDraftClick} disabled={isSaving} className="text-muted-foreground">
                      Convert to Draft
                    </Button>
                  )}
                  {!isPosted && (
                    <Button
                      variant="outline"
                      onClick={handleDeletePostClick}
                      disabled={isSaving}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </Button>
                  )}
                </div>
                {isDraft && (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Draft'}
                    </Button>
                    <Button onClick={handleSchedulePost} disabled={isSaving} className="gradient-blue-primary text-white hover:opacity-90">
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : 'Schedule Post'}
                    </Button>
                  </div>
                )}
                {(isScheduled || isPosted) && (
                  <Button variant="outline" onClick={onClose}>Close</Button>
                )}
              </div>
            </div>
          </motion.div>

          {showPhotoSelector && (
            <PhotoSelector
              onSelectPhoto={handleImageSelection}
              onClose={() => setShowPhotoSelector(false)}
            />
          )}

          <AlertDialog
            open={confirmAction !== null}
            onOpenChange={(open: boolean) => {
              if (!open) setConfirmAction(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmAction === 'convertToDraft'
                    ? 'Convert to draft?'
                    : 'Delete this post?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmAction === 'convertToDraft'
                    ? 'This scheduled post will return to draft. You can edit and schedule it again.'
                    : 'This will permanently delete this post. This action cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeConfirmAction}
                  className={
                    confirmAction === 'deletePost'
                      ? 'bg-destructive text-white hover:bg-destructive/90'
                      : undefined
                  }
                >
                  {confirmAction === 'convertToDraft' ? 'Convert to draft' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
}
