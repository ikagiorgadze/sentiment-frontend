import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Send, Sparkles, User } from 'lucide-react';
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
  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearError,
    hasMore,
    isLoadingMore,
    loadMore,
    isActiveChatLoading,
  } = useChat();
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

  const hasConversation = useMemo(() => messages.some((message) => message.role === 'user'), [messages]);

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 min-h-0 overflow-y-auto pr-2',
          variant === 'dialog' && 'max-h-[60vh]'
        )}
      >
        {isActiveChatLoading ? (
          <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading conversation…
          </div>
        ) : (
          <div className="space-y-4">
            {!hasConversation && (
              <div className="grid gap-2 sm:grid-cols-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
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
        )}
      </div>

      <div className="mt-3 flex-shrink-0 border-t border-slate-200 pt-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <div className="relative">
            <Textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) {
                  clearError();
                }
              }}
              placeholder="Ask about current events, actors, policies, or comparative cases..."
              rows={2}
              className="min-h-[44px] resize-none border-2 border-slate-200 pr-12 focus:border-slate-900"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              disabled={isSending || input.trim().length === 0}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Includes recent reporting, theory, and cited sources</span>
          </div>
        </form>
      </div>
    </div>
  );
}
