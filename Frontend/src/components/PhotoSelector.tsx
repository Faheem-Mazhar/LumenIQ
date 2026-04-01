import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Calendar } from 'lucide-react';
import { Input } from './ui/input';
import { MediaThumbnail } from './MediaThumbnail';
import { useSelector } from 'react-redux';
import type { RootState } from '../auth/store';
import { mediaApi, mapMediaToPhoto } from '../api/media';
import type { Photo } from '../types/photo';

interface PhotoSelectorProps {
  onSelectPhoto: (photoUrl: string) => void;
  onClose: () => void;
}

export function PhotoSelector({ onSelectPhoto, onClose }: PhotoSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeBusiness = useSelector((state: RootState) =>
    state.business.businesses.find((b: { isActive: boolean }) => b.isActive),
  );

  useEffect(() => {
    if (activeBusiness?.id) {
      setIsLoading(true);
      mediaApi.list(activeBusiness.id).then((data) => {
        if (Array.isArray(data)) setPhotos(data.map(mapMediaToPhoto));
      }).catch(() => {}).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [activeBusiness?.id]);

  const filteredPhotos = photos.filter(photo => {
    if (searchQuery === '') return true;
    return (
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Select Photo</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose a photo from your library</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search photos by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background"
            />
          </div>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-accent animate-pulse" />
              ))
            ) : filteredPhotos.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No photos found
              </div>
            ) : null}
            {!isLoading && filteredPhotos.map((photo, index) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectPhoto(photo.url)}
                className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
              >
                <MediaThumbnail
                  src={photo.url}
                  alt={photo.title}
                  mediaType={photo.mediaType}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    {photo.isAIGenerated && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-white text-left">
                    <p className="font-medium text-sm">{photo.title}</p>
                    <div className="flex items-center gap-1 text-xs mt-1 text-white/80">
                      <Calendar className="w-3 h-3" />
                      {formatDate(photo.createdDate)}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}