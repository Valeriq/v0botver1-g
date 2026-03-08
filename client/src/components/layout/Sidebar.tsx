import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  Sparkles, 
  Inbox, 
  Mail,
  Bot,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUIStore } from "@/stores";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Главная", href: "/", icon: LayoutDashboard },
  { name: "Контакты", href: "/contacts", icon: Users },
  { name: "Письма", href: "/emails", icon: Mail },
  { name: "Кампании", href: "/campaigns", icon: Send },
  { name: "AI Профили", href: "/ai-profiles", icon: Sparkles },
  { name: "Лиды", href: "/leads", icon: Inbox },
  { name: "Gmail Аккаунты", href: "/gmail-accounts", icon: Mail },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen } = useUIStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-card w-64 fixed left-0 top-0 z-50 transition-transform duration-300",
      !sidebarOpen && "-translate-x-full"
    )}>
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 text-primary font-display font-bold text-xl">
          <Bot className="h-6 w-6" />
          <span>ColdBot.ai</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className={cn(
                "nav-item group",
                isActive && "active"
              )}>
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.firstName?.[0] || user.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName || user.username || "Пользователь"}
              </p>
              {user.username && (
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
