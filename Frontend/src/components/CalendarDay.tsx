import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { MediaThumbnail, detectMediaType } from './MediaThumbnail';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted';
}

interface CalendarDayProps {
  day: number;
  date: Date;
  isToday: boolean;
  isPast: boolean;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onCreatePost: (date: Date) => void;
}

export function CalendarDay({
  day,
  date,
  isToday,
  isPast,
  posts,
  onPostClick,
  onCreatePost
}: CalendarDayProps) {
  
  // Sort posts by scheduled time
  const sortedPosts = [...posts].sort((a, b) => {
    const timeA = a.scheduledDate?.getTime() || a.createdDate.getTime();
    const timeB = b.scheduledDate?.getTime() || b.createdDate.getTime();
    return timeA - timeB;
  });
  
  return (
    <motion.div
      className={`aspect-square border rounded-lg p-2 relative transition-all overflow-hidden ${
        isPast
          ? 'border-border bg-muted/40 opacity-50 cursor-default'
          : isToday
            ? 'border-primary bg-accent cursor-pointer hover:shadow-md'
            : 'border-border bg-background cursor-pointer hover:shadow-md'
      }`}
      whileHover={isPast ? undefined : { scale: 1.02 }}
      whileTap={isPast ? undefined : { scale: 0.98 }}
    >
      {/* Day number */}
      <div className={`text-sm font-medium mb-1 ${
        isToday ? 'text-primary' : 'text-foreground'
      }`}>
        {day}
      </div>

      {/* Post indicators */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
        {sortedPosts.slice(0, 3).map(post => {
          const firstImage = post.images && post.images.length > 0 ? post.images[0] : null;
          const hasMultipleImages = post.images && post.images.length > 1;
          
          return (
            <button
              key={post.id}
              className="relative cursor-pointer rounded overflow-hidden w-full block group"
              onClick={(e) => {
                e.stopPropagation();
                onPostClick(post);
              }}
            >
              {/* Photo thumbnail or placeholder */}
              {firstImage ? (
                <div className="relative w-full aspect-video">
                  <MediaThumbnail
                    src={firstImage}
                    alt="Post"
                    mediaType={detectMediaType(firstImage)}
                    className="w-full h-full object-cover"
                  />
                  {/* Multiple images indicator */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-0.5 left-0.5 text-[8px] px-1 py-0.5 rounded bg-black/70 text-white font-medium">
                      +{post.images!.length - 1}
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className={`absolute top-0.5 right-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    post.status === 'draft'
                      ? 'bg-yellow-500 text-white'
                      : post.status === 'posted'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                  }`}>
                    {post.status === 'draft' ? 'DRAFT' : post.status === 'posted' ? 'POSTED' : 'SCHEDULED'}
                  </div>
                  {/* Time overlay */}
                  {post.scheduledDate && (
                    <div className="absolute bottom-0.5 right-0.5 text-[8px] px-1 py-0.5 rounded bg-black/70 text-white font-medium flex items-center gap-0.5">
                      <Clock className="w-2 h-2" />
                      {post.scheduledDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full aspect-video">
                  {/* Placeholder image for drafts */}
                  <div className={`w-full h-full flex items-center justify-center ${
                    post.status === 'draft'
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100'
                      : post.status === 'posted'
                        ? 'bg-gradient-to-br from-green-50 to-green-100'
                        : 'bg-gradient-to-br from-red-50 to-red-100'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {post.status === 'draft' ? '📝' : post.status === 'posted' ? '✅' : '📅'}
                      </div>
                    </div>
                  </div>
                  {/* Status badge overlay */}
                  <div className={`absolute top-0.5 right-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    post.status === 'draft'
                      ? 'bg-yellow-500 text-white'
                      : post.status === 'posted'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                  }`}>
                    {post.status === 'draft' ? 'DRAFT' : post.status === 'posted' ? 'POSTED' : 'SCHEDULED'}
                  </div>
                  {/* Time overlay */}
                  {post.scheduledDate && (
                    <div className="absolute bottom-0.5 right-0.5 text-[8px] px-1 py-0.5 rounded bg-black/70 text-white font-medium flex items-center gap-0.5">
                      <Clock className="w-2 h-2" />
                      {post.scheduledDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
        {sortedPosts.length > 3 && (
          <div className="text-[10px] text-muted-foreground text-center bg-muted/50 rounded py-1">
            +{sortedPosts.length - 3} more
          </div>
        )}
      </div>

      {/* Add post button (shows on hover, hidden for past dates) */}
      {posts.length === 0 && !isPast && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreatePost(date);
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          <Plus className="w-5 h-5 text-primary" />
        </button>
      )}
    </motion.div>
  );
}