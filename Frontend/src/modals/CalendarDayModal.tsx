import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { MediaThumbnail, detectMediaType } from '../components/MediaThumbnail';
import { Button } from '../components/ui/button';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted';
}

interface CalendarDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onCreatePost: (date: Date) => void;
}

export function CalendarDayModal({
  isOpen,
  onClose,
  date,
  posts,
  onPostClick,
  onCreatePost,
}: CalendarDayModalProps) {
  const isPast = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  })();

  const sortedPosts = [...posts].sort((a, b) => {
    const timeA = a.scheduledDate?.getTime() || a.createdDate.getTime();
    const timeB = b.scheduledDate?.getTime() || b.createdDate.getTime();
    return timeA - timeB;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30';
      case 'scheduled':
        return 'bg-red-500/10 text-red-600 border border-red-500/30';
      case 'posted':
        return 'bg-green-500/10 text-green-600 border border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'scheduled':
        return 'Scheduled';
      case 'posted':
        return 'Posted';
      default:
        return status;
    }
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
              className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Posts list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                      <ImageIcon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No posts for this day</p>
                  </div>
                ) : (
                  sortedPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => {
                        onPostClick(post);
                        onClose();
                      }}
                      className="w-full bg-background border border-border rounded-xl p-3 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        {post.images && post.images.length > 0 ? (
                          <div className="flex-shrink-0 relative">
                            <MediaThumbnail
                              src={post.images[0]}
                              alt="Post"
                              mediaType={detectMediaType(post.images[0])}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            {post.images.length > 1 && (
                              <div className="absolute bottom-0.5 right-0.5 text-[9px] px-1 py-0.5 rounded bg-black/70 text-white font-medium">
                                +{post.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-sm text-foreground line-clamp-2 leading-snug">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {post.scheduledDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.scheduledDate.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(post.status)}`}
                            >
                              {statusLabel(post.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                {!isPast && (
                  <Button
                    size="sm"
                    className="gradient-blue-primary text-white hover:opacity-90 gap-1.5"
                    onClick={() => {
                      onCreatePost(date);
                      onClose();
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Post
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
