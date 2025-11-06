import { useMemo } from 'react';
import { Plus, Trash2, RefreshCcw } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Chat() {
  const {
    workspace,
    activeChatId,
    activeChat,
    isWorkspaceLoading,
    isActiveChatLoading,
    startNewChat,
    clearChat,
    deleteChat,
  } = useChat();

  const projectLabel = useMemo(() => {
    if (!workspace || !activeChat?.project_id) {
      return null;
    }
    const project = workspace.projects.find((group) => group.project.id === activeChat.project_id);
    return project?.project.name ?? null;
  }, [workspace, activeChat?.project_id]);

  const handleNewChat = () => {
    void startNewChat();
  };

  const handleClearChat = () => {
    if (!activeChatId) {
      return;
    }
    void clearChat();
  };

  const handleDeleteChat = () => {
    if (!activeChatId) {
      return;
    }
    void deleteChat(activeChatId);
  };

  const title = activeChat?.title?.trim() || 'New chat';

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[640px] overflow-hidden">
      <ChatSidebar />
      <div className="flex flex-1 min-h-0 flex-col bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                {projectLabel && <Badge variant="outline">{projectLabel}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isWorkspaceLoading ? 'Refreshing workspace…' : 'Maintain separate threads for each line of analysis.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={!activeChatId || isActiveChatLoading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Clear chat
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteChat}
                disabled={!activeChatId}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete chat
              </Button>
              <Separator orientation="vertical" className="hidden h-6 lg:block" />
              <Button type="button" size="sm" onClick={handleNewChat}>
                <Plus className="mr-2 h-4 w-4" />
                New chat
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatPanel className="h-full p-6" variant="page" />
        </div>
      </div>
    </div>
  );
}
