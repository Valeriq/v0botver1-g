import { useEffect, useRef, useState } from "react";

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: "large" | "medium" | "small";
  cornerRadius?: number;
  requestAccess?: "write";
  showUserPhoto?: boolean;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = "large",
  cornerRadius = 10,
  requestAccess = "write",
  showUserPhoto = true,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.onTelegramAuth = onAuth;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", buttonSize);
    script.setAttribute("data-radius", String(cornerRadius));
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", requestAccess);
    if (showUserPhoto) {
      script.setAttribute("data-userpic", "true");
    }

    script.onload = () => {
      setIsLoading(false);
      setError(null);
    };

    script.onerror = () => {
      setIsLoading(false);
      setError("Не удалось загрузить Telegram виджет. Попробуйте позже или используйте демо режим.");
      console.error("Telegram Widget failed to load");
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div 
        ref={containerRef} 
        className="telegram-login-container flex items-center justify-center"
        data-testid="telegram-login-button"
      />
      
      {isLoading && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Загрузка Telegram виджета...
        </div>
      )}
      
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md max-w-md text-center">
          {error}
        </div>
      )}
    </div>
  );
}
