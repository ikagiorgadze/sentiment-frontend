import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, AlertCircle } from 'lucide-react';

const scrapingSchema = z.object({
  urls: z
    .string()
    .trim()
    .min(1, { message: 'Please enter at least one URL' })
    .refine(
      (val) => {
        const urls = val.split('\n').filter(line => line.trim());
        return urls.every(url => {
          try {
            new URL(url);
            return url.includes('facebook.com');
          } catch {
            return false;
          }
        });
      },
      { message: 'All URLs must be valid Facebook URLs' }
    ),
});

type ScrapingFormData = z.infer<typeof scrapingSchema>;

interface ScrapingFormProps {
  onSubmit: (data: { urls: string[] }) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function ScrapingForm({ onSubmit, isLoading, error }: ScrapingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScrapingFormData>({
    resolver: zodResolver(scrapingSchema),
  });

  const handleFormSubmit = async (data: ScrapingFormData) => {
    const urls = data.urls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    await onSubmit({ urls });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert className="border-2 border-red-600 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900 font-semibold ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Label htmlFor="urls" className="text-base font-bold text-black uppercase tracking-wider">
          Facebook URLs
        </Label>
        <Textarea
          id="urls"
          placeholder="https://facebook.com/page-name&#10;https://facebook.com/posts/123456&#10;https://facebook.com/another-page"
          {...register('urls')}
          disabled={isLoading}
          className="h-40 border-2 border-slate-200 focus:border-black text-base font-mono"
          style={{ fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
        />
        {errors.urls && (
          <p className="text-sm text-red-600 font-semibold">{errors.urls.message}</p>
        )}
        <p className="text-sm text-slate-600">
          Enter one or more Facebook URLs (one per line). Mix <strong>Page URLs</strong> and <strong>Post URLs</strong> as needed.
        </p>
      </div>

      <div className="border-2 border-slate-200 bg-slate-50 p-6 space-y-3">
        <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-3">URL Examples</h4>
        <div className="space-y-2 text-sm">
          <div>
            <div className="font-bold text-black mb-1">Page URL (scrapes all posts):</div>
            <code className="block bg-white border border-slate-200 p-2 text-xs" style={{ fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}>
              https://www.facebook.com/YourPageName
            </code>
          </div>
          <div>
            <div className="font-bold text-black mb-1">Post URL (scrapes specific post + comments):</div>
            <code className="block bg-white border border-slate-200 p-2 text-xs" style={{ fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}>
              https://www.facebook.com/PageName/posts/123456789
            </code>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-black hover:bg-slate-800 text-white h-14 text-base font-bold uppercase tracking-wider"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Starting Scraping Job...
          </>
        ) : (
          <>
            <Play className="mr-3 h-5 w-5" />
            Start Scraping
          </>
        )}
      </Button>

      {/* Disclaimer - smaller and less prominent */}
      <div className="text-xs text-slate-500 pt-2 space-y-1" style={{ fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
        <div className="font-semibold text-slate-600 uppercase tracking-wider">Disclaimer</div>
        <ul className="space-y-1 pl-4">
          <li>• Scraping may take several minutes depending on content volume</li>
          <li>• Sentiment analysis will be performed automatically after scraping</li>
          <li>• You can monitor progress in real-time below</li>
          <li>• Page URLs scrape multiple posts, Post URLs scrape specific posts and comments</li>
        </ul>
      </div>
    </form>
  );
}
