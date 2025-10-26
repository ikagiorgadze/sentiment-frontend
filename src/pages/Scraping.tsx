import { useState } from 'react';
import { useScrapingJobs, useScrapingMutation } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2, XCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function Scraping() {
  const { data: jobs } = useScrapingJobs(3000);
  const scrapingMutation = useScrapingMutation();
  
  const [scrapeType, setScrapeType] = useState<'page' | 'post'>('page');
  const [urls, setUrls] = useState<string[]>(['']);
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addUrl = () => {
    setUrls([...urls, '']);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = scrapeType === 'page' 
        ? { page_urls: validUrls, source: 'web' }
        : { post_urls: validUrls, source: 'web' };

      await scrapingMutation.mutateAsync(requestData);
      toast.success('Scraping job initiated successfully!');
      
      // Reset form
      setUrls(['']);
      setTimeRange('all');
      setCustomStartDate('');
      setCustomEndDate('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate scraping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-black animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-600';
      case 'failed':
        return 'border-l-red-600';
      case 'running':
        return 'border-l-black';
      default:
        return 'border-l-slate-600';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'running':
        return 'bg-black';
      default:
        return 'bg-slate-600';
    }
  };

  const realJobs = jobs || [];
  const hasJobs = realJobs.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 py-16 bg-white">
        <h1 className="text-6xl font-bold mb-3 tracking-tighter text-black px-8">Scraping</h1>
        <p className="text-xl text-slate-600 font-light px-8">Extract and analyze social media data</p>
      </div>

      {/* Disclaimer */}
      <div className="py-8 px-8">
        <div className="bg-red-50 border-2 border-red-200 p-6">
          <h3 className="text-lg font-bold text-red-800 mb-2">Important Notice</h3>
          <p className="text-red-700">
            Scraping results may take considerable time to process, especially for large quantities of data. 
            Additionally, scraped data may sometimes be incomplete or contain inaccuracies due to the nature 
            of web scraping and social media platform changes.
          </p>
        </div>
      </div>

      {/* Scraping Form */}
      <div className="py-12">
        <div className="px-8 mb-12">
          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Start New Scraping Job</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Scrape Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-black uppercase tracking-[0.35em]">Scrape Type</Label>
                <RadioGroup value={scrapeType} onValueChange={(value) => setScrapeType(value as 'page' | 'post')} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="page" id="page" className="mt-0.5" />
                    <Label htmlFor="page" className="text-sm text-slate-700">Facebook Pages</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="post" id="post" className="mt-0.5" />
                    <Label htmlFor="post" className="text-sm text-slate-700">Facebook Posts</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* URLs Input */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-black uppercase tracking-[0.35em]">
                  {scrapeType === 'page' ? 'Page URLs' : 'Post URLs'}
                </Label>
                <div className="space-y-3">
                  {urls.map((url, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="url"
                        placeholder={scrapeType === 'page' 
                          ? 'https://www.facebook.com/pagename' 
                          : 'https://www.facebook.com/username/posts/postid'
                        }
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                        className="flex-1 border-2 border-slate-200 focus:border-black"
                      />
                      {urls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeUrl(index)}
                          className="border-2 border-slate-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrl}
                  className="border-2 border-slate-200 hover:border-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another URL
                </Button>
              </div>

              {/* Time Range Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-black uppercase tracking-[0.35em]">
                  Time Range (Optional)
                </Label>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)] md:max-w-sm">
                  <Select
                    value={timeRange}
                    onValueChange={(value) => setTimeRange(value as 'all' | '24h' | '7d' | '30d' | 'custom')}
                  >
                    <SelectTrigger className="border-2 border-slate-200 bg-white focus:border-black">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-slate-200">
                      <SelectItem value="all">All Time (default)</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {timeRange === 'custom' && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 tracking-[0.25em]">
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(event) => setCustomStartDate(event.target.value)}
                        className="border-2 border-slate-200 focus:border-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700 tracking-[0.25em]">
                        End Date
                      </Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(event) => setCustomEndDate(event.target.value)}
                        className="border-2 border-slate-200 focus:border-black"
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  This control is optional and doesn't affect scraping yet—use it to note the recency you care about.
                </p>
              </div>

              {/* Facebook URL Instructions */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-black uppercase tracking-[0.35em]">How to Get Facebook URLs</Label>
                <div className="bg-slate-50 border-2 border-slate-200 p-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-black mb-2">Facebook Pages:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                      <li>Navigate to the Facebook page you want to scrape</li>
                      <li>Copy the URL from your browser's address bar</li>
                      <li>Example: <code className="bg-slate-100 px-2 py-1 text-xs">https://www.facebook.com/cocacola</code></li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-bold text-black mb-2">Facebook Posts:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                      <li>Find the post you want to scrape</li>
                      <li>Click the three dots (⋯) at the top right of the post</li>
                      <li>Select "Save post" to add it to your saved collection</li>
                      <li>Go to your saved posts collection</li>
                      <li>Click on the saved post to open it</li>
                      <li>Copy the URL from your browser's address bar</li>
                      <li>Example: <code className="bg-slate-100 px-2 py-1 text-xs">https://www.facebook.com/username/posts/1234567890</code></li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black hover:bg-slate-800 text-white border-2 border-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Scraping Job...
                    </>
                  ) : (
                    'Start Scraping'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Jobs List - Compact */}
        <h2 className="text-2xl font-bold text-black tracking-tight mb-6 px-8">Recent Jobs</h2>
        
        {hasJobs ? (
          <div className="border-2 border-slate-900">
            {realJobs.map((job, index) => (
              <div 
                key={job.id} 
                className={`bg-white p-6 border-l-4 ${getStatusColor(job.status)} ${index < realJobs.length - 1 ? 'border-b-2 border-slate-200' : ''}`}
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Status + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getStatusIcon(job.status)}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-black tracking-tight">
                        Job {job.id}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Center: Progress */}
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-600 font-semibold">{job.progress}%</span>
                      <span className="text-slate-500">{job.processedItems}/{job.totalItems}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100">
                      <div 
                        className={`h-2 transition-all ${getProgressColor(job.status)}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Completion */}
                  {job.completedAt && (
                    <div className="text-sm text-slate-600 whitespace-nowrap">
                      {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                    </div>
                  )}

                  {/* Error - Full width if exists */}
                  {job.error && (
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-600">{job.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 p-12 text-center">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-base text-slate-600">
              No jobs yet. Start a new scraping job above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
