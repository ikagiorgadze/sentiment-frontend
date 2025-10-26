import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChatPanel } from './ChatPanel';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/chat') {
    return null;
  }

  const handleLaunch = () => {
    if (isDesktop) {
      setOpen(true);
    } else {
      navigate('/chat');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          type="button"
          size="lg"
          className="shadow-xl"
          onClick={handleLaunch}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Ask AI Assistant
        </Button>
      </div>

      <Dialog open={open && isDesktop} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
            <DialogDescription>
              Get political science analysis grounded in current reporting and academic research.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ChatPanel variant="dialog" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
