import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CalendarView } from '../components/CalendarView';
import { PostModal } from '../modals/PostModal';
import { PostDetailModal } from '../modals/PostDetailModal';
import { PostListModal } from '../modals/PostListModal';
import { Plus, Calendar, FileText, CalendarDays, Layers, PenLine } from 'lucide-react';

interface Post {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled';
}

export function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop'],
      caption: 'Excited to share our new product line! Check out these amazing features. #ProductLaunch #Innovation',
      createdDate: new Date(2026, 0, 20),
      scheduledDate: new Date(2026, 0, 25, 14, 0),
      status: 'scheduled'
    },
    {
      id: '2',
      caption: 'Behind the scenes at our office. Our team is working hard to bring you the best experience! #TeamWork',
      createdDate: new Date(2026, 0, 22),
      status: 'draft'
    },
    {
      id: '3',
      images: ['https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop'],
      caption: 'Customer success story: How we helped increase engagement by 200%. Read more on our blog! #CaseStudy',
      createdDate: new Date(2026, 0, 28),
      scheduledDate: new Date(2026, 0, 30, 10, 0),
      status: 'scheduled'
    },
    {
      id: '4',
      images: [
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop'
      ],
      caption: 'Team collaboration in action! Our dedicated team brings innovative solutions to life. #Teamwork #Innovation',
      createdDate: new Date(2026, 0, 25),
      scheduledDate: new Date(2026, 1, 5, 9, 0),
      status: 'scheduled'
    },
    {
      id: '5',
      images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop'],
      caption: 'Q1 Planning Session — Setting ambitious goals for the quarter ahead!',
      createdDate: new Date(2026, 0, 25),
      scheduledDate: new Date(2026, 1, 5, 15, 0),
      status: 'scheduled'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPosts, setSelectedPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listFilter, setListFilter] = useState<'draft' | 'scheduled'>('scheduled');

  const handleCreatePost = (date: Date) => {
    setSelectedDate(date);
    setSelectedPosts([]);
    setIsModalOpen(true);
  };

  const handleSavePost = (postData: Partial<Post>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      caption: postData.caption || '',
      createdDate: postData.createdDate || new Date(),
      scheduledDate: postData.scheduledDate,
      status: postData.status || 'draft',
      images: postData.images
    };
    setPosts([...posts, newPost]);
  };

  const handleUpdatePost = (postId: string, updates: Partial<Post>) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    ));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostDetailModalOpen(true);
  };

  const handleShowList = (filter: 'draft' | 'scheduled') => {
    setListFilter(filter);
    setIsListModalOpen(true);
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const draftPosts = posts.filter(p => p.status === 'draft');

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Total Posts</p>
                <p className="text-[28px] leading-none font-outfit text-foreground">{posts.length}</p>
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
                <p className="text-[28px] leading-none font-outfit text-blue-600">{scheduledPosts.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-wide">Drafts</p>
                <p className="text-[28px] leading-none font-outfit text-foreground">{draftPosts.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <PenLine className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </Card>
        </div>

        <CalendarView
          posts={posts}
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
          posts={listFilter === 'scheduled' ? scheduledPosts : draftPosts}
          filter={listFilter}
          onPostClick={handlePostClick}
        />
      </div>
  );
}
