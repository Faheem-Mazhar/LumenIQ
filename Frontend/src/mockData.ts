// ═══════════════════════════════════════════════════════════
// MOCK DATA
//
// This file centralizes all mock/placeholder data used
// across the app. When the backend API is connected:
//   1. Move the exported types to a shared types file
//   2. Delete this file
//   3. Replace imports with API hook calls
// ═══════════════════════════════════════════════════════════

// ── Dashboard Types ────────────────────────────────────────

export type TimeRange = '7D' | '30D' | '90D';
export type PostType = 'image' | 'video' | 'text' | 'article';
export type PostStatus = 'ready' | 'draft' | 'review';
export type ActivityType = 'milestone' | 'ai' | 'scheduled' | 'growth' | 'follower';

export interface KpiItem {
  key: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
}

export interface AudienceDataPoint {
  date: string;
  followers: number;
  impressions: number;
}

export interface EngagementDataPoint {
  day: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface PlatformItem {
  name: string;
  value: number;
  color: string;
  followers: string;
  growth: string;
}

export interface UpcomingPost {
  id: string;
  title: string;
  platform: string;
  scheduledTime: string;
  type: PostType;
  status: PostStatus;
}

export interface TopPost {
  id: string;
  title: string;
  platform: string;
  impressions: string;
  engagement: string;
  likes: number;
  comments: number;
  image: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: ActivityType;
}

// ── Calendar Types ─────────────────────────────────────────

export interface CalendarPost {
  id: string;
  images?: string[];
  caption: string;
  createdDate: Date;
  scheduledDate?: Date;
  status: 'draft' | 'scheduled';
}

// ── Photo Types ────────────────────────────────────────────

export interface Photo {
  id: string;
  title: string;
  url: string;
  createdDate: Date;
  scheduledDate?: Date;
  isAIGenerated: boolean;
  tags: string[];
  usedInPosts: number;
}

// ── Settings Types ─────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  instagramHandle: string;
  brandColor: string;
  location: string;
  isActive: boolean;
}

export interface CurrentPlan {
  name: string;
  price: number;
  type: string;
  billingPeriod: string;
  maxBrands: number;
  features: string[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  postReminders: boolean;
  weeklyReports: boolean;
  aiSuggestions: boolean;
}

export interface PaymentMethod {
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

// ── Pricing Types ──────────────────────────────────────────

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

// ── Plan Selection Types ───────────────────────────────────

export interface PlanOption {
  id: string;
  name: string;
  priceLabel: string;
  description?: string;
  features?: string[];
  isEnterprise?: boolean;
}

export interface PlanStream {
  id: string;
  title: string;
  subtitle: string;
  plans: PlanOption[];
}

// ═══════════════════════════════════════════════════════════
// Dashboard Data
// ═══════════════════════════════════════════════════════════

export const MOCK_KPI_DATA: KpiItem[] = [
  { key: 'followers', label: 'Total Followers', value: '24,521', change: 12.5, changeLabel: 'vs last period' },
  { key: 'impressions', label: 'Impressions', value: '148.2K', change: 8.3, changeLabel: 'vs last period' },
  { key: 'engagementRate', label: 'Engagement Rate', value: '4.7%', change: 0.8, changeLabel: 'vs last period' },
  { key: 'scheduledPosts', label: 'Scheduled Posts', value: '12', change: -2.1, changeLabel: 'vs last week' },
];

export const MOCK_AUDIENCE_GROWTH: Record<TimeRange, AudienceDataPoint[]> = {
  '7D': [
    { date: 'Mon', followers: 24120, impressions: 18400 },
    { date: 'Tue', followers: 24180, impressions: 21200 },
    { date: 'Wed', followers: 24250, impressions: 19800 },
    { date: 'Thu', followers: 24310, impressions: 24600 },
    { date: 'Fri', followers: 24380, impressions: 22100 },
    { date: 'Sat', followers: 24460, impressions: 26800 },
    { date: 'Sun', followers: 24521, impressions: 23400 },
  ],
  '30D': [
    { date: 'Week 1', followers: 22800, impressions: 124000 },
    { date: 'Week 2', followers: 23200, impressions: 138000 },
    { date: 'Week 3', followers: 23800, impressions: 142000 },
    { date: 'Week 4', followers: 24521, impressions: 148200 },
  ],
  '90D': [
    { date: 'Jan', followers: 19400, impressions: 98000 },
    { date: 'Feb', followers: 21200, impressions: 118000 },
    { date: 'Mar', followers: 24521, impressions: 148200 },
  ],
};

export const MOCK_ENGAGEMENT: EngagementDataPoint[] = [
  { day: 'Mon', likes: 342, comments: 89, shares: 56, saves: 124 },
  { day: 'Tue', likes: 456, comments: 102, shares: 78, saves: 156 },
  { day: 'Wed', likes: 389, comments: 94, shares: 62, saves: 138 },
  { day: 'Thu', likes: 521, comments: 134, shares: 91, saves: 189 },
  { day: 'Fri', likes: 478, comments: 118, shares: 84, saves: 167 },
  { day: 'Sat', likes: 612, comments: 156, shares: 108, saves: 213 },
  { day: 'Sun', likes: 534, comments: 128, shares: 92, saves: 178 },
];

export const MOCK_PLATFORMS: PlatformItem[] = [
  { name: 'Instagram', value: 45, color: '#E1306C', followers: '11.2K', growth: '+4.2%' },
  { name: 'Facebook', value: 25, color: '#1877F2', followers: '6.1K', growth: '+1.8%' },
  { name: 'X / Twitter', value: 18, color: '#1DA1F2', followers: '4.4K', growth: '+3.1%' },
  { name: 'LinkedIn', value: 12, color: '#0A66C2', followers: '2.8K', growth: '+6.5%' },
];

export const MOCK_UPCOMING_POSTS: UpcomingPost[] = [
  { id: '1', title: 'Product Launch Teaser', platform: 'Instagram', scheduledTime: 'Today, 2:00 PM', type: 'image', status: 'ready' },
  { id: '2', title: 'Weekly Tips Thread', platform: 'X / Twitter', scheduledTime: 'Today, 5:30 PM', type: 'text', status: 'ready' },
  { id: '3', title: 'Behind the Scenes Reel', platform: 'Instagram', scheduledTime: 'Tomorrow, 10:00 AM', type: 'video', status: 'draft' },
  { id: '4', title: 'Industry Insights Article', platform: 'LinkedIn', scheduledTime: 'Tomorrow, 1:00 PM', type: 'article', status: 'review' },
];

export const MOCK_TOP_POSTS: TopPost[] = [
  {
    id: '1',
    title: 'New Collection Drop',
    platform: 'Instagram',
    impressions: '12.4K',
    engagement: '8.2%',
    likes: 1024,
    comments: 89,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Customer Success Story',
    platform: 'LinkedIn',
    impressions: '8.7K',
    engagement: '6.4%',
    likes: 556,
    comments: 134,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Team Culture Video',
    platform: 'Facebook',
    impressions: '6.2K',
    engagement: '5.1%',
    likes: 316,
    comments: 67,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', text: 'Instagram post "New Collection" reached 1K impressions', time: '2 min ago', type: 'milestone' },
  { id: '2', text: 'Weekly content plan auto-generated for Mar 10–16', time: '1 hr ago', type: 'ai' },
  { id: '3', text: '"Product Launch Teaser" scheduled for today at 2:00 PM', time: '3 hrs ago', type: 'scheduled' },
  { id: '4', text: 'Engagement rate up 0.8% compared to last week', time: '5 hrs ago', type: 'growth' },
  { id: '5', text: '3 new followers on LinkedIn from Industry Insights post', time: '8 hrs ago', type: 'follower' },
];

// ═══════════════════════════════════════════════════════════
// Calendar Data
// ═══════════════════════════════════════════════════════════

export const MOCK_CALENDAR_POSTS: CalendarPost[] = [
  {
    id: '1',
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop'],
    caption: 'Excited to share our new product line! Check out these amazing features. #ProductLaunch #Innovation',
    createdDate: new Date(2026, 0, 20),
    scheduledDate: new Date(2026, 0, 25, 14, 0),
    status: 'scheduled',
  },
  {
    id: '2',
    caption: 'Behind the scenes at our office. Our team is working hard to bring you the best experience! #TeamWork',
    createdDate: new Date(2026, 0, 22),
    status: 'draft',
  },
  {
    id: '3',
    images: ['https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop'],
    caption: 'Customer success story: How we helped increase engagement by 200%. Read more on our blog! #CaseStudy',
    createdDate: new Date(2026, 0, 28),
    scheduledDate: new Date(2026, 0, 30, 10, 0),
    status: 'scheduled',
  },
  {
    id: '4',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
    ],
    caption: 'Team collaboration in action! Our dedicated team brings innovative solutions to life. #Teamwork #Innovation',
    createdDate: new Date(2026, 0, 25),
    scheduledDate: new Date(2026, 1, 5, 9, 0),
    status: 'scheduled',
  },
  {
    id: '5',
    images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop'],
    caption: 'Q1 Planning Session — Setting ambitious goals for the quarter ahead!',
    createdDate: new Date(2026, 0, 25),
    scheduledDate: new Date(2026, 1, 5, 15, 0),
    status: 'scheduled',
  },
];

// ═══════════════════════════════════════════════════════════
// Photo Storage Data
// ═══════════════════════════════════════════════════════════

export const MOCK_PHOTOS: Photo[] = [
  { id: '1', title: 'Business Team', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 15), scheduledDate: new Date(2026, 0, 25), isAIGenerated: true, tags: ['business', 'team', 'office'], usedInPosts: 2 },
  { id: '2', title: 'Collaboration Meeting', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 18), isAIGenerated: false, tags: ['collaboration', 'meeting'], usedInPosts: 1 },
  { id: '3', title: 'Workspace Laptop', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 20), isAIGenerated: true, tags: ['workspace', 'laptop'], usedInPosts: 0 },
  { id: '4', title: 'Innovation Technology', url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 22), scheduledDate: new Date(2026, 0, 30), isAIGenerated: false, tags: ['innovation', 'technology'], usedInPosts: 1 },
  { id: '5', title: 'Professional Portrait', url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 24), isAIGenerated: true, tags: ['professional', 'portrait'], usedInPosts: 0 },
  { id: '6', title: 'Discussion Planning', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop', createdDate: new Date(2026, 0, 26), isAIGenerated: false, tags: ['discussion', 'planning'], usedInPosts: 3 },
];

// ═══════════════════════════════════════════════════════════
// Settings Data
// ═══════════════════════════════════════════════════════════

export const MOCK_CURRENT_PLAN: CurrentPlan = {
  name: 'Growth',
  price: 139,
  type: 'Digital Business',
  billingPeriod: 'monthly',
  maxBrands: 5,
  features: [
    'Up to 5 brands',
    'Unlimited social profiles',
    'Advanced AI content generation',
    'Unlimited auto-planners',
    'Priority support',
  ],
};

export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'My Main Business',
    description: 'A great business doing amazing things',
    websiteUrl: 'https://mybusiness.com',
    instagramHandle: '@mybusiness',
    brandColor: '#3b82f6',
    location: 'New York, USA',
    isActive: true,
  },
  {
    id: '2',
    name: 'Secondary Brand',
    description: 'My second business venture',
    websiteUrl: 'https://secondbrand.com',
    instagramHandle: '@secondbrand',
    brandColor: '#10b981',
    location: 'Los Angeles, USA',
    isActive: false,
  },
];

export const MOCK_PERSONAL_INFO: PersonalInfo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
};

export const MOCK_NOTIFICATION_DEFAULTS: NotificationPreferences = {
  emailNotifications: true,
  postReminders: true,
  weeklyReports: false,
  aiSuggestions: true,
};

export const MOCK_PAYMENT_METHOD: PaymentMethod = {
  last4: '4242',
  expiryMonth: 12,
  expiryYear: 2025,
};

// ═══════════════════════════════════════════════════════════
// Pricing Data
// ═══════════════════════════════════════════════════════════

export const MOCK_DIGITAL_PLANS: PricingPlan[] = [
  { id: 'digital-solo', name: 'Solo', price: 39, period: 'month', description: 'Ideal for solo founders validating presence', features: ['1 brand', 'Up to 6 social profiles', 'Product pull (basic)', 'Monthly auto-planner', 'Tap-to-publish + posting reminders', 'Essential analytics (last 90 days)'] },
  { id: 'digital-starter', name: 'Starter', price: 79, period: 'month', description: 'Ideal for growing digital brands with light teams', popular: true, features: ['2 brands', 'Up to 12 social profiles', 'Product sync + SKU tagging', '2 auto-planners per month', 'A/B testing for hooks & captions', '6-month analytics history + exports', 'Basic approval workflow'] },
  { id: 'digital-growth', name: 'Growth', price: 139, period: 'month', description: 'Ideal for scaling digital operations and agencies', features: ['5 brands', 'Up to 24 social profiles', 'Unified UTM + Google Analytics dashboard', 'Seasonal content templates', 'Bulk scheduling via CSV', 'Asset library (images, templates)', 'Review-mining prompts (UGC-inspired content)', '12-month analytics + PDF/CSV exports'] },
  { id: 'digital-enterprise', name: 'Enterprise', price: 0, period: 'custom', description: 'Tailored based on business profile and scale', features: ['5+ brands', 'Custom feature set', 'Custom analytics depth', 'Priority support & onboarding', 'Dedicated account manager'] },
];

export const MOCK_PHYSICAL_PLANS: PricingPlan[] = [
  { id: 'physical-solo', name: 'Solo', price: 29, period: 'month', description: 'Ideal for single-location operators', features: ['1 brand', 'Core scheduling & posting', 'Local-focused content templates', 'Essential analytics'] },
  { id: 'physical-starter', name: 'Starter', price: 59, period: 'month', description: 'Ideal for small teams and busy storefronts', popular: true, features: ['2 brands', 'Up to 12 social profiles', '2 auto-planners per month', 'Promotion, offer, and event templates', 'Basic approval flow', 'Activity log', '6-month analytics + exports'] },
  { id: 'physical-growth', name: 'Growth', price: 119, period: 'month', description: 'Ideal for multi-location or high-traffic businesses', features: ['5 brands', 'Up to 24 social profiles', 'Seasonal calendar planning', 'Bulk scheduling via CSV', 'Asset library', 'Localization tokens (menu, hours, location, events)', '12-month analytics + PDF/CSV exports'] },
  { id: 'physical-enterprise', name: 'Enterprise', price: 0, period: 'custom', description: 'Tailored per organization', features: ['5+ brands', 'Multi-location customization', 'Advanced localization logic', 'Custom workflows', 'Priority support'] },
];

// ═══════════════════════════════════════════════════════════
// Plan Selection Data
// ═══════════════════════════════════════════════════════════

export const MOCK_PLAN_STREAMS: PlanStream[] = [
  {
    id: 'digital',
    title: 'Stream A',
    subtitle: 'Digital businesses',
    plans: [
      { id: 'digital-solo', name: 'Solo', priceLabel: '$39/mo', features: ['1 brand', 'up to 6 social profiles', 'product pull (basic)', 'monthly auto-planner', 'tap-to-publish + reminders', 'essentials analytics (90-day)'] },
      { id: 'digital-starter', name: 'Starter', priceLabel: '$79/mo', features: ['2 brands', 'up to 12 profiles', 'product sync + SKU tags', '2 auto-planners/mo', 'A/B hooks & captions', '6-month analytics + exports', 'basic approvals'] },
      { id: 'digital-growth', name: 'Growth', priceLabel: '$139/mo', features: ['5 brands', 'up to 24 profiles', 'UTM/GA merge dashboard', 'seasonal templates', 'bulk scheduling (CSV)', 'asset library', 'review-mining prompts', '12-month analytics + PDF/CSV'] },
      { id: 'digital-enterprise', name: 'Enterprise', priceLabel: 'Custom', description: 'Customized based on business profile (5+ brands)', isEnterprise: true },
    ],
  },
  {
    id: 'physical',
    title: 'Stream B',
    subtitle: 'Physical businesses',
    plans: [
      { id: 'physical-solo', name: 'Solo', priceLabel: '$29/mo' },
      { id: 'physical-starter', name: 'Starter', priceLabel: '$59/mo', features: ['2 brands', 'up to 12 profiles', '2 auto-planners/mo', 'promo/offer & event templates', 'basic approvals & activity log', '6-month analytics + exports'] },
      { id: 'physical-growth', name: 'Growth', priceLabel: '$119/mo', features: ['5 brands', 'up to 24 profiles', 'seasonal calendars', 'bulk scheduling (CSV)', 'asset library', 'localization tokens (menu/hours/neighbourhood/class schedule)', '12-month analytics + PDF/CSV'] },
      { id: 'physical-enterprise', name: 'Enterprise', priceLabel: 'Custom', description: 'Customized based on business profile (5+ brands)', isEnterprise: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// Chatbot / AI Data
// ═══════════════════════════════════════════════════════════

export const MOCK_CHATBOT_GREETING =
  "Hello! I'm your LumenIQ AI assistant. I can help you create engaging social media content, schedule posts, analyze trends, and manage your social media strategy. What would you like to work on today?";

export const MOCK_CHATBOT_RESPONSES = [
  "I'd be happy to help you create content! What type of post would you like to create? I can generate captions for product launches, behind-the-scenes content, customer testimonials, or promotional posts.",
  "Great idea! Based on your content strategy, I recommend posting during peak engagement hours. Would you like me to schedule this for you?",
  "I've analyzed your recent posts and noticed that posts with images get 3x more engagement. Would you like me to help you select images from your photo library?",
  "That sounds perfect! Let me help you craft a compelling caption. What are the key points you'd like to highlight?",
  "I can help you with that! To create the best content, could you tell me more about your target audience and the message you want to convey?",
];

export const MOCK_AI_GENERATION_GREETING =
  "Hi! I'm your AI content assistant. I can help you discover trends, generate images, and optimize captions. How can I help you today?";

export const MOCK_AI_TREND_RESPONSE =
  "Based on current trends, here are some insights:\n\n• Short-form video content is performing 3x better than static posts\n• User-generated content drives 2x more engagement\n• Behind-the-scenes content shows 150% higher reach\n\nWould you like me to generate content based on these trends?";

export const MOCK_AI_IMAGE_RESPONSE_TEXT =
  "I've generated an image based on your description. You can save this to your photo storage or use it in a post.";

export const MOCK_AI_IMAGE_URL =
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop';

export const MOCK_AI_CAPTION_RESPONSE =
  '📱 Optimized Caption:\n\n"Transform your business with cutting-edge solutions! ✨\n\nDiscover how our platform helps you:\n💡 Streamline your workflow\n🚀 Boost productivity by 200%\n🎯 Reach your target audience\n\nReady to level up? Link in bio! 👆\n\n#BusinessGrowth #Innovation #ProductivityHacks #DigitalTransformation"';

export const MOCK_AI_CAPTIONS = [
  '✨ Embracing new beginnings and endless possibilities! What inspires you today? 💫 #Motivation #Inspiration',
  '🌟 Creating moments that matter. Join us on this journey! 🚀 #Community #Growth',
  '💡 Innovation meets creativity. Ready to make an impact? 🎯 #Business #Success',
  "🎨 Where vision becomes reality. Let's build something amazing together! 🌈 #Creative #Vision",
];
