import { Menu, Bell, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useUIStore } from '../../stores';

export function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">ColdBot</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="User menu">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
