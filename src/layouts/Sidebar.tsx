import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, Download, BookOpen, Users, MessageSquareText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    title: 'Posts',
    href: '/posts',
    icon: FileText,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    title: 'AI Assistant',
    href: '/chat',
    icon: MessageSquareText,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    title: 'Pages',
    href: '/pages',
    icon: BookOpen,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    title: 'Scraping',
    href: '/scraping',
    icon: Download,
    roles: ['admin', 'user'],
  },
];

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const { user } = useAuth();

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || 'viewer')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo and brand */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Sentiment Database</h1>
              <p className="text-xs font-medium text-muted-foreground">Analytics Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-1">
              <div className="mb-2 px-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </h2>
              </div>
              <nav className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </ScrollArea>

          {/* User info footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs font-semibold text-foreground">Welcome back</p>
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
