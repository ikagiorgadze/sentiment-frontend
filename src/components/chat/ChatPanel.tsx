import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getAssistantEndpoint } from '@/lib/assistantConfig';
import { Loader2, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';

type MessageRole = 'assistant' | 'user';
type MessageStatus = 'ready' | 'pending' | 'error';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: number;
}

interface ChatPanelProps {
  className?: string;
  variant?: 'page' | 'dialog';
}

const MAX_HISTORY = 40;

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createWelcomeMessage = (): ChatMessage => ({
  id: makeId(),
  role: 'assistant',
  content:
    "Hi! I'm your political intelligence co-pilot. Ask about elections, coalitions, democratization, or policy shifts and I'll summarize recent reporting, academic perspectives, and relevant history.",
  status: 'ready',
  createdAt: Date.now(),
});

const getFallbackMessages = () => [createWelcomeMessage()];

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as ChatMessage;
  return (
    typeof candidate.id === 'string' &&
    (candidate.role === 'assistant' || candidate.role === 'user') &&
    typeof candidate.content === 'string' &&
    (candidate.status === 'ready' || candidate.status === 'pending' || candidate.status === 'error') &&
    typeof candidate.createdAt === 'number'
  );
};

const loadMessages = (key: string): ChatMessage[] => {
  if (typeof window === 'undefined') {
    return getFallbackMessages();
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return getFallbackMessages();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.filter(isChatMessage);
      if (sanitized.length) {
        return sanitized;
      }
    }
  } catch (error) {
    console.warn('Unable to restore chat history', error);
  }
  return getFallbackMessages();
};

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
            className="text-primary underline underline-offset-2 break-words"
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
  const assistantEndpoint = useMemo(() => getAssistantEndpoint(), []);
  const { user } = useAuth();
  const userIdentifier = user?.id || user?.email || 'guest';
  const storageKey = useMemo(() => `ai-assistant-history-${userIdentifier}`, [userIdentifier]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storageKey));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadMessages(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (storageError) {
      console.warn('Unable to persist chat history', storageError);
    }
  }, [messages, storageKey]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const sendMessage = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    setInput('');
    setError(null);

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      status: 'ready',
      createdAt: Date.now(),
    };

    const assistantPlaceholder: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      content: 'Analyzing your question...',
      status: 'pending',
      createdAt: Date.now(),
    };

    const placeholderId = assistantPlaceholder.id;

    const historyWindow = [...messages, userMessage]
      .filter((msg) => msg.role !== 'assistant' || msg.status === 'ready')
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => {
      const next = [...prev, userMessage, assistantPlaceholder];
      return next.slice(-MAX_HISTORY);
    });

    setIsSending(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(assistantEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: trimmed,
          history: historyWindow,
          auth_user_id: user?.id,
        }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new Error(rawText || 'Assistant is unavailable right now. Please try again.');
      }

      const formatted = rawText.trim() || 'No analysis was returned for that prompt.';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? { ...msg, content: formatted, status: 'ready', createdAt: Date.now() }
            : msg,
        ),
      );
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : 'Unable to fetch the analysis. Please try again later.';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                ...msg,
                content: fallback,
                status: 'error',
                createdAt: Date.now(),
              }
            : msg,
        ),
      );
      setError(fallback);
    } finally {
      setIsSending(false);
      controllerRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSending) {
      sendMessage(input);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isSending) return;
    sendMessage(prompt);
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
          onChange={(event) => setInput(event.target.value)}
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
