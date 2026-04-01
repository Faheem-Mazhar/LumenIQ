import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CalendarView } from '../components/CalendarView';
import { PostModal } from '../modals/PostCreationModal';
import { PostDetailModal } from '../modals/ViewPostModal';
import { PostListModal } from '../modals/PostListModal';
import { Plus, Calendar, FileText, CalendarDays, Layers, PenLine, Loader2, CheckCircle } from 'lucide-react';
import type { RootState } from '../auth/store';
import { calendarApi } from '../api/calendar';
import { mapCalendarPostFromAPI } from '../types/calendar';
import type { CalendarPost } from '../types/calendar';
import { toast } from 'sonner';

type Post = CalendarPost;

export function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeBusiness = useSelector((state: RootState) =>
    state.business.businesses.find((b) => b.isActive),
  );
  const businessId = activeBusiness?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPosts, setSelectedPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listFilter, setListFilter] = useState<'draft' | 'scheduled' | 'posted'>('scheduled');

  const handledNavAction = useRef(false);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const apiPosts = await calendarApi.listPosts(businessId);
        if (!cancelled) setPosts(apiPosts.map(mapCalendarPostFromAPI));
      } catch {
        // endpoint may not exist yet
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [businessId]);

  useEffect(() => {
    const state = location.state as { action?: string } | null;
    if (!state?.action || handledNavAction.current) return;
    handledNavAction.current = true;

    if (state.action === 'new-post') {
      setSelectedDate(new Date());
      setSelectedPosts([]);
      setIsModalOpen(true);
    } else if (state.action === 'drafts') {
      setListFilter('draft');
      setIsListModalOpen(true);
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const handleCreatePost = (date: Date) => {
    setSelectedDate(date);
    setSelectedPosts([]);
    setIsModalOpen(true);
  };

  const handleSavePost = async (postData: Partial<Post>) => {
    if (!businessId) return;
    try {
      const created = await calendarApi.createPost(businessId, {
        caption: postData.caption || '',
        media: postData.images || [],
        scheduled_at: postData.scheduledDate?.toISOString(),
        status: postData.status || 'draft',
      });
      setPosts(prev => [...prev, mapCalendarPostFromAPI(created)]);
      toast.success('Post created');
    } catch (err) {
      console.error('Failed to create calendar post:', err);
      toast.error('Failed to save post');
      const newPost: Post = {
        id: Date.now().toString(),
        caption: postData.caption || '',
        createdDate: postData.createdDate || new Date(),
        scheduledDate: postData.scheduledDate,
        status: postData.status || 'draft',
        images: postData.images,
      };
      setPosts(prev => [...prev, newPost]);
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<Post>) => {
    if (!businessId) return;
    try {
      const payload: Record<string, unknown> = {};
      if ('caption' in updates) payload.caption = updates.caption;
      if ('images' in updates) payload.media = updates.images;
      if ('status' in updates) payload.status = updates.status;
      if ('scheduledDate' in updates) {
        payload.scheduled_at = updates.scheduledDate
          ? updates.scheduledDate.toISOString()
          : null;
      }
      const updated = await calendarApi.updatePost(businessId, postId, payload);
      setPosts(prev =>
        prev.map(post => (post.id === postId ? mapCalendarPostFromAPI(updated) : post)),
      );
      toast.success('Post updated');
    } catch (err) {
      console.error('Failed to update calendar post:', err);
      toast.error('Failed to update post');
      setPosts(prev =>
        prev.map(post => (post.id === postId ? { ...post, ...updates } : post)),
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!businessId) return;
    try {
      await calendarApi.deletePost(businessId, postId);
      toast.success('Post deleted');
    } catch (err) {
      console.error('Failed to delete calendar post:', err);
      toast.error('Failed to delete post');
    }
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostDetailModalOpen(true);
  };

  const handleShowList = (filter: 'draft' | 'scheduled' | 'posted') => {
    setListFilter(filter);
    setIsListModalOpen(true);
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const postedPosts = posts.filter(p => p.status === 'posted');

  return (
    <div className="space-y-6 pb-8 font-switzer max-w-[108rem] mx-auto flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-[26px] font-outfit text-foreground leading-tight">Content Calendar</h1>
            <p className="text-sm text-muted-foreground">Plan and schedule your social media content</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleShowList('scheduled')}
              className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-3.5 w-3.5" />
              Scheduled ({scheduledPosts.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShowList('posted')}
              className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Posted ({postedPosts.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShowList('draft')}
              className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              Drafts ({draftPosts.length})
            </Button>
            <Button
              onClick={() => handleCreatePost(new Date())}
              className="gradient-blue-primary text-white hover:opacity-90 h-8 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Post
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Total Posts</p>
                <p className="text-[28px] leading-none font-outfit text-foreground">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : posts.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Scheduled</p>
                <p className="text-[28px] leading-none font-outfit">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : scheduledPosts.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                <CalendarDays className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Posted</p>
                <p className="text-[28px] leading-none font-outfit text-foreground">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : postedPosts.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Drafts</p>
                <p className="text-[28px] leading-none font-outfit text-foreground">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : draftPosts.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
                <PenLine className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        <CalendarView
          posts={posts}
          isLoading={isLoading}
          onPostClick={handlePostClick}
          onCreatePost={handleCreatePost}
        />

        <PostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          posts={selectedPosts}
          onSavePost={handleSavePost}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />

        <PostDetailModal
          isOpen={isPostDetailModalOpen}
          onClose={() => setIsPostDetailModalOpen(false)}
          post={selectedPost}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />

        <PostListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          posts={listFilter === 'scheduled' ? scheduledPosts : listFilter === 'posted' ? postedPosts : draftPosts}
          filter={listFilter}
          onPostClick={handlePostClick}
        />
      </div>
  );
}
