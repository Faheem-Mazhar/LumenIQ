import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { CloudUpload, X, Trash2, CheckCircle2, ImageIcon } from 'lucide-react';
import { Progress } from '../components/ui/progress';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() ?? '';
  return ext;
}

export function FileUploadModal({
  open,
  onOpenChange,
  onUpload,
  maxSizeMB = 15,
}: FileUploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
    if (file.size > maxSizeMB * 1024 * 1024) return;

    const id = crypto.randomUUID();
    const entry: UploadFile = {
      id,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    };

    setFiles((prev) => [...prev, entry]);

    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id && f.status === 'uploading'
            ? { ...f, progress: Math.min(f.progress + 15, 90) }
            : f,
        ),
      );
    }, 200);

    try {
      await onUpload(file);
      clearInterval(interval);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: 100, status: 'completed' } : f)),
      );
    } catch {
      clearInterval(interval);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'error' } : f)),
      );
    }
  }, [maxSizeMB, onUpload]);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      Array.from(incoming).forEach(processFile);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-6 font-switzer">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <CloudUpload className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-outfit text-slate-900">
                Upload files
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Select and upload the files of your choice
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/*File Upload Drag Section*/}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-blue-400/50 bg-blue-500/5'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <CloudUpload className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-900">
              Choose a file or drag &amp; drop it here.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              JPEG, PNG, GIF, and WEBP formats, up to {maxSizeMB} MB.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-1 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={() => inputRef.current?.click()}
          >
            Browse File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-1 space-y-3">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {f.status === 'completed' ? (
                    <ImageIcon className="h-4 w-4 text-slate-500" />
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {getFileExtension(f.name)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{formatFileSize(f.size)}</span>
                    <span>&middot;</span>
                    <span className={f.status === 'completed' ? 'text-emerald-500 font-medium' : ''}>
                      {f.status === 'uploading'
                        ? 'Uploading...'
                        : f.status === 'completed'
                          ? 'Completed'
                          : 'Failed'}
                    </span>
                  </div>
                  {f.status === 'uploading' && (
                    <Progress value={f.progress} className="mt-1.5 h-1.5 bg-slate-100" />
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {f.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  <button
                    onClick={() => removeFile(f.id)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {f.status === 'uploading' ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
