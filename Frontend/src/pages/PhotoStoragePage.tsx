import { useState } from 'react';
import {
  Upload,
  Search,
  Calendar,
  Image as ImageIcon,
  Trash2,
  Grid,
  List,
  X,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { type Photo, MOCK_PHOTOS } from '../mockData';

export function PhotoStoragePage() {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'uploaded'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('12:00');

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.tags.some(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'ai' && photo.isAIGenerated) ||
      (filterType === 'uploaded' && !photo.isAIGenerated);

    return (searchQuery === '' || matchesSearch) && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    setSelectedPhoto(null);
  };

  const handleUseInPost = () => {
    setShowDatePicker(true);
  };

  const handleSchedulePost = () => {
    alert(`Photo scheduled for ${selectedDate} at ${selectedTime}`);
    setShowDatePicker(false);
    setSelectedPhoto(null);
  };

  const filterOptions: { key: typeof filterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ai', label: 'AI Generated' },
    { key: 'uploaded', label: 'Uploaded' },
  ];

  return (
    <div className="space-y-6 pb-8 font-switzer max-w-[108rem] mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[26px] font-outfit text-foreground leading-tight">Photo Storage</h1>
          <p className="text-sm text-muted-foreground">Manage your media library</p>
        </div>
        <Button className="gradient-blue-primary text-white hover:opacity-90 h-8 text-xs gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Upload Photos
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-[13px] text-muted-foreground tracking-wide">Total Images</p>
              <p className="text-[28px] leading-none font-outfit text-foreground">{photos.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-[13px] text-muted-foreground tracking-wide">AI Generated</p>
              <p className="text-[28px] leading-none font-outfit text-foreground">
                {photos.filter(p => p.isAIGenerated).length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-[13px] text-muted-foreground tracking-wide">Uploaded</p>
              <p className="text-[28px] leading-none font-outfit text-foreground">
                {photos.filter(p => !p.isAIGenerated).length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-border/60 bg-card p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-[13px] text-muted-foreground tracking-wide">Used in Posts</p>
              <p className="text-[28px] leading-none font-outfit text-foreground">
                {photos.reduce((sum, p) => sum + p.usedInPosts, 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Eye className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-border/60 bg-card p-0">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs border-border bg-card"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilterType(opt.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    filterType === opt.key
                      ? 'gradient-blue-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'gradient-blue-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'gradient-blue-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-md"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-3 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                <div className="flex items-start justify-between">
                  {photo.isAIGenerated && (
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
                      AI
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className="ml-auto rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1 text-[11px] text-white/80">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(photo.createdDate)}
                  </div>
                  {photo.usedInPosts > 0 && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Used in {photo.usedInPosts} post{photo.usedInPosts !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-border/60 bg-card p-0">
          <div className="divide-y divide-border/40">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30 cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{photo.title}</p>
                    {photo.isAIGenerated && (
                      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(photo.createdDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {photo.usedInPosts} post{photo.usedInPosts !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {photo.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <Card className="border-border/60 bg-card p-10 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No photos found</p>
        </Card>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close photo details"
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid md:grid-cols-2">
              <div className="p-4 md:p-5">
                <img
                  src={selectedPhoto.url}
                  alt="Selected"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
              <div className="space-y-5 p-5 md:p-6">
                <h3 className="text-[15px] font-outfit text-foreground">{selectedPhoto.title}</h3>

                <div className="space-y-3">
                  <DetailRow label="Created" value={formatDate(selectedPhoto.createdDate)} />
                  {selectedPhoto.scheduledDate && (
                    <DetailRow label="Scheduled" value={formatDate(selectedPhoto.scheduledDate)} />
                  )}
                  <DetailRow
                    label="Type"
                    value={selectedPhoto.isAIGenerated ? 'AI Generated' : 'Uploaded'}
                  />
                  <DetailRow
                    label="Used in"
                    value={`${selectedPhoto.usedInPosts} post${selectedPhoto.usedInPosts !== 1 ? 's' : ''}`}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPhoto.tags.map(tag => (
                        <span
                          key={tag}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gradient-blue-primary text-white hover:opacity-90 h-8 text-xs"
                    onClick={handleUseInPost}
                  >
                    Use in Post
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl"
          >
            <div className="border-b border-border/40 px-5 py-4">
              <h3 className="text-[15px] font-outfit text-foreground">Schedule Post</h3>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-xs border-border bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="h-8 text-xs border-border bg-card"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 gradient-blue-primary text-white hover:opacity-90 h-8 text-xs"
                  onClick={handleSchedulePost}
                >
                  Schedule
                </Button>
                <Button
                  variant="outline"
                  className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
                  onClick={() => setShowDatePicker(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
