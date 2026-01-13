import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  Sparkles, 
  Inbox, 
  Mail,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Главная", href: "/", icon: LayoutDashboard },
  { name: "Контакты", href: "/contacts", icon: Users },
  { name: "Кампании", href: "/campaigns", icon: Send },
  { name: "AI Профили", href: "/ai-profiles", icon: Sparkles },
  { name: "Лиды", href: "/leads", icon: Inbox },
  { name: "Gmail Аккаунты", href: "/gmail-accounts", icon: Mail },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen flex-col border-r bg-card w-64 fixed left-0 top-0 z-50">
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
        <div className="rounded-xl bg-primary/5 p-4">
          <h3 className="text-sm font-semibold text-primary mb-1">Нужна помощь?</h3>
          <p className="text-xs text-muted-foreground mb-3">Ознакомьтесь с документацией для настройки.</p>
          <button className="text-xs font-medium text-primary hover:underline">
            Документация
          </button>
        </div>
      </div>
    </div>
  );
}
