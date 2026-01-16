import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { TelegramLoginButton, type TelegramUser } from "@/components/TelegramLoginButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

const TELEGRAM_BOT_NAME = "makegoodmarketingbot";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleTelegramAuth = async (user: TelegramUser) => {
    try {
      await login(user);
      setLocation("/");
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Send className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">AI Cold Email Bot</CardTitle>
          <CardDescription className="text-base">
            Войдите через Telegram для доступа к системе email-рассылок
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pb-8">
          <TelegramLoginButton
            botName={TELEGRAM_BOT_NAME}
            onAuth={handleTelegramAuth}
            buttonSize="large"
            cornerRadius={10}
          />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Нажмите кнопку выше для быстрой авторизации через ваш Telegram аккаунт
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
