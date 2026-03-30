import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  CalendarDays,
  Plus,
  ArrowUpRight,
  Clock,
  Send,
  FileText,
  Sparkles,
  Target,
  MessageCircle,
  ChevronRight,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import type { RootState } from '../auth/store';
import { analyticsApi } from '../api/analytics';
import { calendarApi } from '../api/calendar';
import type {
  TimeRange,
  PostType,
  PostStatus,
  ActivityType,
  KpiItem,
  AudienceDataPoint,
  EngagementDataPoint,
  PlatformItem,
  TopPost,
  ActivityItem,
  UpcomingPost,
} from '../types/analytics';
import type { CalendarPostAPI } from '../types/calendar';

const KPI_DISPLAY_CONFIG: Record<string, { icon: React.ReactNode; accent: string }> = {
  followers: { icon: <Users className="h-5 w-5 text-blue-600" />, accent: 'bg-blue-50' },
  impressions: { icon: <Eye className="h-5 w-5 text-violet-600" />, accent: 'bg-violet-50' },
  engagementRate: { icon: <Heart className="h-5 w-5 text-rose-500" />, accent: 'bg-rose-50' },
  scheduledPosts: { icon: <CalendarDays className="h-5 w-5 text-emerald-600" />, accent: 'bg-emerald-50' },
};

const POST_TYPE_DISPLAY: Record<PostType, { className: string; icon: React.ReactNode }> = {
  image: { className: 'bg-pink-50 text-pink-500', icon: <Heart className="h-3.5 w-3.5" /> },
  video: { className: 'bg-violet-50 text-violet-500', icon: <Eye className="h-3.5 w-3.5" /> },
  article: { className: 'bg-blue-50 text-blue-500', icon: <FileText className="h-3.5 w-3.5" /> },
  text: { className: 'bg-slate-50 text-slate-500', icon: <MessageCircle className="h-3.5 w-3.5" /> },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  accent,
  hideChange,
}: {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  accent: string;
  hideChange?: boolean;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-switzer text-muted-foreground tracking-wide">{label}</p>
          <p className="text-[28px] leading-none font-outfit text-foreground">{value}</p>
          {!hideChange && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const styles = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    review: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const labels = { ready: 'Ready', draft: 'Draft', review: 'In Review' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const config = {
    milestone: { bg: 'bg-blue-50', icon: <Target className="h-3.5 w-3.5 text-blue-600" /> },
    ai: { bg: 'bg-violet-50', icon: <Sparkles className="h-3.5 w-3.5 text-violet-600" /> },
    scheduled: { bg: 'bg-emerald-50', icon: <Clock className="h-3.5 w-3.5 text-emerald-600" /> },
    growth: { bg: 'bg-amber-50', icon: <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> },
    follower: { bg: 'bg-pink-50', icon: <Users className="h-3.5 w-3.5 text-pink-600" /> },
  };
  const { bg, icon } = config[type];
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
      {icon}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}</span>
          <span className="ml-auto font-medium text-foreground">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function mapCalendarPostToUpcoming(post: CalendarPostAPI): UpcomingPost {
  const firstLine = (post.caption ?? 'Untitled').split('\n')[0].slice(0, 50);
  return {
    id: post.id,
    title: firstLine,
    platform: post.platform ?? 'Instagram',
    scheduledTime: post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : '',
    type: (post.post_type as PostType) ?? 'image',
    status: post.status === 'scheduled' ? 'ready' : 'draft',
  };
}

function SkeletonCard() {
  return (
    <Card className="border-border/60 bg-card p-5 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
      <div className="h-8 bg-muted rounded w-1/2 mb-3" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </Card>
  );
}

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');

  // Per-section loading flags so each section renders as soon as its data
  // arrives — above-the-fold cards appear first, charts follow shortly after.
  const [kpiLoading, setKpiLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Keep a single derived flag for components that only need to know
  // whether anything is still loading.
  const isLoading = kpiLoading || chartsLoading;

  const activeBusiness = useSelector((state: RootState) =>
    state.business.businesses.find((b) => b.isActive),
  );
  const businessId = activeBusiness?.id;

  const [kpiData, setKpiData] = useState<KpiItem[]>([]);
  const [audienceData, setAudienceData] = useState<AudienceDataPoint[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementDataPoint[]>([]);
  const [platformData, setPlatformData] = useState<PlatformItem[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!businessId) return;

    // ── Wave 1 (immediate): above-the-fold KPI cards + platform badges ──
    setKpiLoading(true);
    setChartsLoading(true);

    const [kpis, platforms] = await Promise.allSettled([
      analyticsApi.getKpis(businessId, timeRange),
      analyticsApi.getPlatforms(businessId),
    ]);

    if (kpis.status === 'fulfilled') setKpiData(kpis.value);
    if (platforms.status === 'fulfilled') setPlatformData(platforms.value);
    setKpiLoading(false);

    // ── Wave 2 (after Wave 1): charts, top posts, activity, calendar ──
    const [audience, engagement, top, activity] = await Promise.allSettled([
      analyticsApi.getAudience(businessId, timeRange),
      analyticsApi.getEngagement(businessId, timeRange),
      analyticsApi.getTopPosts(businessId, timeRange),
      analyticsApi.getActivity(businessId),
    ]);

    if (audience.status === 'fulfilled') setAudienceData(audience.value);
    if (engagement.status === 'fulfilled') setEngagementData(engagement.value);
    if (top.status === 'fulfilled') setTopPosts(top.value);
    if (activity.status === 'fulfilled') setRecentActivity(activity.value);

    try {
      const calendarPosts = await calendarApi.listPosts(businessId);
      const scheduled = calendarPosts.filter(p => p.status === 'scheduled');

      setUpcomingPosts(scheduled.slice(0, 4).map(mapCalendarPostToUpcoming));

      setKpiData(prev =>
        prev.map(kpi =>
          kpi.key === 'scheduledPosts'
            ? { ...kpi, value: scheduled.length.toString() }
            : kpi,
        ),
      );
    } catch {
      // calendar endpoint may not be populated yet
    }

    setChartsLoading(false);
  }, [businessId, timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-8 font-switzer">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[26px] font-outfit text-foreground leading-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            {(['7D', '30D', '90D'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'gradient-blue-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button className="gradient-blue-primary text-white hover:opacity-90 h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Post
          </Button>
        </div>
      </div>

      {isLoading && kpiData.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpiData.map((kpi) => {
              const display = KPI_DISPLAY_CONFIG[kpi.key];
              return display ? (
                <KpiCard
                  key={kpi.key}
                  label={kpi.label}
                  value={kpi.value}
                  change={kpi.change}
                  changeLabel={kpi.changeLabel}
                  icon={display.icon}
                  accent={display.accent}
                  hideChange={kpi.key === 'scheduledPosts'}
                />
              ) : null;
            })}
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Audience Growth Chart */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <div>
                    <h3 className="text-[15px] font-outfit text-foreground">Audience Growth</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Follower count &amp; impressions over time</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-5 text-xs text-muted-foreground mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Followers
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-200" />
                      Impressions
                    </div>
                  </div>
                  {audienceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={audienceData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradFollowers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#93c5fd" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => formatNumber(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={2} fill="url(#gradFollowers)" name="Followers" />
                        <Area type="monotone" dataKey="impressions" stroke="#93c5fd" strokeWidth={1.5} fill="url(#gradImpressions)" name="Impressions" strokeDasharray="4 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'No audience data yet'}
                    </div>
                  )}
                </div>
              </Card>

              {/* Engagement Breakdown Chart */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <div>
                    <h3 className="text-[15px] font-outfit text-foreground">Engagement Breakdown</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Likes, comments, shares &amp; saves by day</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-5 pt-4 pb-2">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-1">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} /> Likes</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#60a5fa' }} /> Comments</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#93c5fd' }} /> Shares</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#bfdbfe' }} /> Saves</div>
                  </div>
                  {engagementData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={engagementData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="likes" name="Likes" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="comments" name="Comments" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="shares" name="Shares" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="saves" name="Saves" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'No engagement data yet'}
                    </div>
                  )}
                </div>
              </Card>

              {/* Top Performing Posts */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <div>
                    <h3 className="text-[15px] font-outfit text-foreground">Top Performing Posts</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Highest engagement this period</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-border/40">
                  {topPosts.length > 0 ? topPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{post.platform}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.impressions}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-foreground">{post.engagement}</p>
                        <p className="text-[11px] text-muted-foreground">engagement</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No top posts yet'}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-border/60 bg-card p-0">
                <div className="border-b border-border/40 px-5 py-4">
                  <h3 className="text-[15px] font-outfit text-foreground">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5 p-4">
                  <button className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/50 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-blue-primary text-white shadow-sm"><Sparkles className="h-4 w-4" /></div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-700">AI Planner</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/50 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm"><Plus className="h-4 w-4" /></div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-700">New Post</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/50 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-white shadow-sm"><FileText className="h-4 w-4" /></div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-violet-700">Drafts</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/50 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm"><Send className="h-4 w-4" /></div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-amber-700">Publish</span>
                  </button>
                </div>
              </Card>

              {/* Platform Performance */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <h3 className="text-[15px] font-outfit text-foreground">Platform Split</h3>
                  <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                {platformData.length > 0 ? (
                  <div className="flex items-center gap-4 px-5 pt-4 pb-2">
                    <div className="h-[120px] w-[120px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={platformData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {platformData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {platformData.map((platform) => (
                        <div key={platform.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: platform.color }} />
                            <span className="text-xs text-foreground">{platform.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{platform.followers}</span>
                            <span className="text-[10px] text-emerald-600">{platform.growth}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No platform data yet'}
                  </div>
                )}
              </Card>

              {/* Upcoming Posts */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <div>
                    <h3 className="text-[15px] font-outfit text-foreground">Upcoming Posts</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Next 48 hours</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Calendar <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-border/40">
                  {upcomingPosts.length > 0 ? upcomingPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${POST_TYPE_DISPLAY[post.type]?.className ?? 'bg-slate-50 text-slate-500'}`}>
                        {POST_TYPE_DISPLAY[post.type]?.icon ?? <MessageCircle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{post.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{post.platform}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-[11px] text-muted-foreground">{post.scheduledTime}</span>
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No upcoming posts'}
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border/60 bg-card p-0">
                <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                  <h3 className="text-[15px] font-outfit text-foreground">Recent Activity</h3>
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-border/40">
                  {recentActivity.length > 0 ? recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                      <ActivityIcon type={item.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-snug text-foreground">{item.text}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No recent activity'}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
