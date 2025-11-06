import { useEffect, useMemo, useState } from 'react';
import { Plus, MoreVertical, MessageSquare, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSummary } from '@/services/chatService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  const {
    workspace,
    workspaceError,
    isWorkspaceLoading,
    activeChatId,
    startNewChat,
    selectChat,
    renameChat,
    deleteChat,
    moveChatToProject,
    createProject,
    updateProject,
    deleteProject,
  } = useChat();

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!workspace) {
      setExpandedProjects({});
      return;
    }

    setExpandedProjects((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const group of workspace.projects) {
        if (!(group.project.id in next)) {
          next[group.project.id] = true;
        }
      }
      return next;
    });
  }, [workspace]);

  const projectOptions = useMemo(
    () => workspace?.projects.map((group) => group.project) ?? [],
    [workspace],
  );

  const handleCreateProject = async () => {
    const name = window.prompt('Project name');
    if (name && name.trim().length > 0) {
      await createProject({ name: name.trim() });
    }
  };

  const handleRenameProject = async (projectId: string, currentName: string) => {
    const name = window.prompt('Rename project', currentName);
    if (name && name.trim().length > 0) {
      await updateProject(projectId, { name: name.trim() });
    }
  };

  const handleRenameChat = async (chatId: string, currentTitle: string | null) => {
    const name = window.prompt('Rename chat', currentTitle ?? 'New chat');
    if (name && name.trim().length > 0) {
      await renameChat(chatId, name.trim());
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const confirmed = window.confirm('Delete this chat? This cannot be undone.');
    if (confirmed) {
      await deleteChat(chatId);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      'Delete this project? Chats will remain available under ungroupped conversations.',
    );
    if (confirmed) {
      await deleteProject(projectId);
    }
  };

  const ChatRow = ({
    chat,
  }: {
    chat: ChatSummary;
  }) => {
    const isActive = chat.id === activeChatId;
    const title = chat.title?.trim() || 'New chat';

    return (
      <div
        className={cn(
          'group flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors',
          isActive ? 'border-primary bg-primary/5 text-primary' : 'border-transparent hover:border-slate-200 hover:bg-slate-100',
        )}
        onClick={() => void selectChat(chat.id)}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          {(chat.last_message_preview ?? '').length > 0 && (
            <span className="mt-0.5 truncate text-xs text-muted-foreground">{chat.last_message_preview}</span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-2 h-8 w-8 text-muted-foreground hover:text-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Conversation</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRenameChat(chat.id, chat.title)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to project</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => moveChatToProject(chat.id, null)}>
                  No project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {projectOptions.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => moveChatToProject(chat.id, project.id)}
                  >
                    {project.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteChat(chat.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-80 flex-col border-r border-slate-200 bg-slate-50', className)}>
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Assistant chats</h2>
        <p className="text-xs text-muted-foreground">Organize by project to keep related conversations together.</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" className="flex-1" onClick={() => void startNewChat()}>
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handleCreateProject}>
            <Folder className="mr-2 h-4 w-4" />
            New project
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        {workspaceError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {workspaceError}
          </div>
        )}

        {isWorkspaceLoading && !workspace ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
          </div>
        ) : workspace ? (
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Ungrouped
              </h3>
              <div className="space-y-2">
                {workspace.standalone.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-xs text-muted-foreground">
                    Conversations without a project will show up here. Start a new chat to begin.
                  </div>
                ) : (
                  workspace.standalone.map((chat) => <ChatRow key={chat.id} chat={chat} />)
                )}
              </div>
            </div>

            {workspace.projects.map((group) => {
              const { project, chats } = group;
              const expanded = expandedProjects[project.id] ?? true;
              return (
                <div key={project.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-900"
                      onClick={() =>
                        setExpandedProjects((prev) => ({
                          ...prev,
                          [project.id]: !expanded,
                        }))
                      }
                    >
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="truncate">{project.name}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(event) => {
                          event.stopPropagation();
                          void startNewChat({ projectId: project.id });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Project</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleRenameProject(project.id, project.name)}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {expanded && (
                    <div className="space-y-2 border-t border-slate-200 px-3 py-3">
                      {chats.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-xs text-muted-foreground">
                          No chats yet. Create one to get started.
                        </div>
                      ) : (
                        chats.map((chat) => <ChatRow key={chat.id} chat={chat} />)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No chats yet. Click <span className="font-semibold">New chat</span> to start your first conversation.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
