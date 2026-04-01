export interface Photo {
  id: string;
  title: string;
  url: string;
  mediaType: 'image' | 'video';
  createdDate: Date;
  scheduledDate?: Date;
  isAIGenerated: boolean;
  tags: string[];
  usedInPosts: number;
}
