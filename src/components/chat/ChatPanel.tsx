import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@/contexts/ChatContext';

interface ChatPanelProps {
  className?: string;
  variant?: 'page' | 'dialog';
}

const MarkdownMessage = ({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none text-slate-900 prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-primary">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noreferrer"
            className="break-words text-primary underline underline-offset-2"
          />
        ),
        p: ({ node, ...props }) => <p {...props} className="text-sm leading-relaxed text-slate-700" />,
        li: ({ node, ...props }) => <li {...props} className="text-sm leading-relaxed text-slate-700" />,
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code {...props} className="rounded bg-muted px-1 py-0.5 font-mono text-xs" />
          ) : (
            <code
              {...props}
              className="block rounded bg-muted px-3 py-2 font-mono text-xs leading-relaxed text-slate-800"
            />
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export function ChatPanel({ className, variant = 'page' }: ChatPanelProps) {
  const { messages, isSending, error, sendMessage, clearError, hasMore, isLoadingMore, loadMore } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    void sendMessage(trimmed);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isSending) return;
    setInput('');
    void sendMessage(prompt);
  };

  const handleLoadMore = () => {
    void loadMore();
  };

  const quickPrompts = [
    'Compare election reforms in Latin America since 2018.',
    'What are the key factions in the current coalition talks in Spain?',
    'Assess risks of democratic erosion in Georgia over the next year.',
  ];

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto pr-2',
          variant === 'dialog' ? 'max-h-[60vh]' : 'min-h-[420px]',
        )}
      >
        <div className="space-y-4">
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-xs text-muted-foreground"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show More'
                )}
              </Button>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'assistant' ? 'justify-start' : 'justify-end',
              )}
            >
              {message.role === 'assistant' && (
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/10 text-slate-900">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm',
                  message.role === 'assistant'
                    ? 'border-slate-200 bg-white text-slate-900'
                    : 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {message.role === 'assistant' ? (
                  message.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Preparing analysis…</span>
                    </div>
                  ) : (
                    <MarkdownMessage content={message.content} />
                  )
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary-foreground/90">
                    {message.content}
                  </p>
                )}
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleQuickPrompt(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (error) {
              clearError();
            }
          }}
          placeholder="Ask about current events, actors, policies, or comparative cases..."
          rows={variant === 'dialog' ? 3 : 4}
          className="resize-none border-2 border-slate-200 focus:border-slate-900"
          disabled={isSending}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Includes recent reporting, theory, and cited sources</span>
          </div>
          <Button type="submit" disabled={isSending || input.trim().length === 0}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
