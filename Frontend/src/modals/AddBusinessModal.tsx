import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { businessApi, mapBusinessToFrontend } from '../api/businesses';
import { useDispatch } from 'react-redux';
import { addBusiness } from '../auth/store/businessSlice';
import { toast } from 'sonner';

interface BusinessFormData {
  name: string;
  description: string;
  websiteUrl: string;
  instagramHandle: string;
  location: string;
}

interface AddBusinessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: BusinessFormData;
  onChange: (updates: Partial<BusinessFormData>) => void;
  onSubmit: () => void;
}

export function AddBusinessModal({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit
}: AddBusinessModalProps) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await businessApi.create({
        name: value.name,
        description: value.description || undefined,
        website_url: value.websiteUrl || undefined,
        instagram_handle: value.instagramHandle || undefined,
        target_location: value.location || undefined,
      });

      const mapped = mapBusinessToFrontend(created);
      dispatch(addBusiness(mapped));
      toast.success('Business created successfully');
      onSubmit();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create business';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full rounded-2xl border border-slate-200 bg-white/95 p-6 font-switzer">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-outfit text-slate-900">Add a new business</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Provide the same details you can edit later for your business.
          </DialogDescription>
        </DialogHeader>

        <Card className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBusinessName" className="text-slate-700">Business Name</Label>
              <Input
                id="newBusinessName"
                value={value.name}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder="My New Business"
                className="border-slate-200 bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newBusinessDesc" className="text-slate-700">Description</Label>
              <Textarea
                id="newBusinessDesc"
                value={value.description}
                onChange={(event) => onChange({ description: event.target.value })}
                placeholder="Brief description"
                className="min-h-20 border-slate-200 bg-white/90"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newBusinessWebsite" className="text-slate-700">Website URL</Label>
                <Input
                  id="newBusinessWebsite"
                  type="url"
                  value={value.websiteUrl}
                  onChange={(event) => onChange({ websiteUrl: event.target.value })}
                  placeholder="https://example.com"
                  className="border-slate-200 bg-white/90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newBusinessInstagram" className="text-slate-700">Instagram Handle</Label>
                <Input
                  id="newBusinessInstagram"
                  value={value.instagramHandle}
                  onChange={(event) => onChange({ instagramHandle: event.target.value })}
                  placeholder="@yourbusiness"
                  className="border-slate-200 bg-white/90"
                />
              </div>
            </div>
          </div>
        </Card>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!value.name || isSubmitting}
            className="gradient-blue-primary text-white hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Business'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
