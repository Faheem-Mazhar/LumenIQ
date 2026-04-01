import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { MediaThumbnail, detectMediaType } from '../components/MediaThumbnail';
import { Button } from '../components/ui/button';
import type { CalendarPost as Post } from '../types/calendar';

interface PostListModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  filter: 'draft' | 'scheduled' | 'posted';
  onPostClick: (post: Post) => void;
}

export function PostListModal({
  isOpen,
  onClose,
  posts,
  filter,
  onPostClick
}: PostListModalProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const groupedPosts = posts.reduce((acc, post) => {
    const dateSource = (filter === 'scheduled' || filter === 'posted') && post.scheduledDate
      ? post.scheduledDate
      : post.createdDate;
    const date = new Date(dateSource.getFullYear(), dateSource.getMonth(), dateSource.getDate());
    
    const dateKey = date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  const sortedDateKeys = Object.keys(groupedPosts).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

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
              className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  {filter === 'scheduled' ? (
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-destructive" />
                    </div>
                  ) : filter === 'posted' ? (
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {filter === 'scheduled' ? 'Scheduled Posts' : filter === 'posted' ? 'Posted' : 'Draft Posts'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'}
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      {filter === 'scheduled' ? (
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                      ) : filter === 'posted' ? (
                        <CheckCircle className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      No {filter} posts yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedDateKeys.map((dateKey) => {
                      const postsForDate = groupedPosts[dateKey];
                      const date = new Date(dateKey);
                      
                      return (
                        <div key={dateKey} className="space-y-3">
                          {/* Date Header */}
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {postsForDate.length} {postsForDate.length === 1 ? 'post' : 'posts'}
                            </span>
                          </div>

                          {/* Posts for this date */}
                          <div className="space-y-3">
                            {postsForDate.map((post) => (
                              <button
                                key={post.id}
                                onClick={() => {
                                  onPostClick(post);
                                  onClose();
                                }}
                                className="w-full bg-background border border-border rounded-xl p-4 hover:shadow-md transition-all text-left group"
                              >
                                <div className="flex gap-4">
                                  {/* Image Preview */}
                                  {post.images && post.images.length > 0 ? (
                                    <div className="flex-shrink-0">
                                      {post.images.length === 1 ? (
                                        <MediaThumbnail
                                          src={post.images[0]}
                                          alt="Post"
                                          mediaType={detectMediaType(post.images[0])}
                                          className="w-24 h-24 object-cover rounded-lg"
                                        />
                                      ) : (
                                        <div className="relative w-24 h-24">
                                          <MediaThumbnail
                                            src={post.images[0]}
                                            alt="Post"
                                            mediaType={detectMediaType(post.images[0])}
                                            className="w-24 h-24 object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-medium text-sm">
                                              +{post.images.length - 1}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <p className="text-sm text-foreground line-clamp-2">
                                      {post.caption}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      {post.scheduledDate && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {post.scheduledDate.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                      {post.images && post.images.length > 1 && (
                                        <div className="flex items-center gap-1">
                                          <ImageIcon className="w-3 h-3" />
                                          {post.images.length} images
                                        </div>
                                      )}
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                          post.status === 'draft'
                                            ? 'bg-muted text-muted-foreground'
                                            : post.status === 'posted'
                                              ? 'bg-green-500/10 text-green-500'
                                              : 'bg-destructive/10 text-destructive'
                                        }`}
                                      >
                                        {post.status === 'draft' ? 'Draft' : post.status === 'posted' ? 'Posted' : 'Scheduled'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-border bg-muted/30">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
