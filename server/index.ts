import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import cookieSession from "cookie-session";

const app = express();
const httpServer = createServer(app);

// Graceful shutdown - корректное завершение работы
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    log(`Получен сигнал ${signal}, но уже завершаем работу...`, 'shutdown');
    return;
  }

  isShuttingDown = true;
  log(`Получен сигнал ${signal}, начинаем graceful shutdown...`, 'shutdown');

  // Закрываем HTTP сервер
  httpServer.close(() => {
    log('HTTP сервер закрыт', 'shutdown');
    process.exit(0);
  });

  // Принудительное завершение через 10 секунд
  setTimeout(() => {
    log('Принудительное завершение процесса', 'shutdown');
    process.exit(1);
  }, 10000);
};

// Обработка сигналов завершения
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Обработка необработанных исключений
process.on('uncaughtException', (error: Error) => {
  log(`❌ Необработанное исключение: ${error.message}`, 'error');
  log(error.stack || '', 'error');
  
  if (!isShuttingDown) {
    gracefulShutdown('uncaughtException');
  }
});

// Обработка необработанных rejected Promise
process.on('unhandledRejection', (reason: any) => {
  log(`❌ Необработанный rejection: ${reason}`, 'error');
  if (reason instanceof Error && reason.stack) {
    log(reason.stack, 'error');
  }
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use(cookieSession({
  name: "session",
  keys: [process.env.SESSION_SECRET || "dev-secret-key-change-in-production"],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(
    {
      port,
      host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    },
    () => {
      log(`serving on http://localhost:${port}`);
      if (process.env.NODE_ENV !== "production") {
        log(`Demo mode: API доступен по http://localhost:${port}/api/*`);
        log(`Demo mode: Веб-интерфейс доступен по http://localhost:${port}`);
      }
    },
  );
})();
