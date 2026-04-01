export interface CalendarPost {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted';
}

export interface CalendarPostAPI {
  id: string;
  caption: string | null;
  media: string[];
  scheduled_at: string | null;
  status: string;
  post_type: string | null;
  platform: string | null;
  created_at: string;
  updated_at: string | null;
}

export function mapCalendarPostFromAPI(post: CalendarPostAPI): CalendarPost {
  return {
    id: post.id,
    images: post.media.length > 0 ? post.media : undefined,
    caption: post.caption ?? '',
    createdDate: new Date(post.created_at),
    scheduledDate: post.scheduled_at ? new Date(post.scheduled_at) : undefined,
    status: post.status === 'scheduled' ? 'scheduled' : (post.status === 'published' || post.status === 'posted') ? 'posted' : 'draft',
  };
}
