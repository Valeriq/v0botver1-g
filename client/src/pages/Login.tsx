import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { TelegramLoginButton, type TelegramUser } from "@/components/TelegramLoginButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Play } from "lucide-react";

const TELEGRAM_BOT_NAME = "makegoodmarketingbot";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      // Call demo auth endpoint
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          // Manually set user in context since demo auth bypasses normal login
          window.location.reload(); // Simple way to trigger auth refresh
        }
      } else {
        console.error("Demo authentication failed");
      }
    } catch (error) {
      console.error("Demo login error:", error);
    } finally {
      setIsDemoLoading(false);
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
            Войдите для доступа к системе email-рассылок
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pb-8">
          <div className="w-full space-y-3">
            <TelegramLoginButton
              botName={TELEGRAM_BOT_NAME}
              onAuth={handleTelegramAuth}
              buttonSize="large"
              cornerRadius={10}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  или
                </span>
              </div>
            </div>

            <Button
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="w-full"
              size="lg"
            >
              {isDemoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Попробовать демо
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Для полной функциональности войдите через Telegram
            </p>
            <p className="text-xs text-muted-foreground">
              Демо режим позволяет ознакомиться с интерфейсом
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
