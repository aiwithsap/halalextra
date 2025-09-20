console.log("🚀 STARTUP: Loading imports...");
import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";

console.log("🚀 STARTUP: Creating Express app...");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
console.log("🚀 STARTUP: Basic middleware configured...");

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let server;
  
  try {
    console.log("🚀 STARTUP: Starting async initialization...");
    
    console.log("🚀 STARTUP: Attempting to load full routes...");
    const { registerRoutes } = await import("./routes");
    server = await registerRoutes(app);
    console.log("🚀 STARTUP: Full routes registered successfully!");

    console.log("🚀 STARTUP: Setting up error handler...");
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    console.log("🚀 STARTUP: Checking environment...", app.get("env"));
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("🚀 STARTUP: Setting up Vite (dev mode)...");
      await setupVite(app, server);
    } else {
      console.log("🚀 STARTUP: Setting up static serving (production)...");
      serveStatic(app);
    }
    console.log("🚀 STARTUP: Static/Vite setup complete!");

    // Use Railway's PORT environment variable or default to 3000
    const port = process.env.PORT || 3000;
    console.log("🚀 STARTUP: Starting server on port", port);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log("✅ SERVER STARTED: serving on port", port);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("💥 FULL SERVER FAILED:", error);
    console.error("🔄 Falling back to minimal server...");
    
    try {
      // Import and setup minimal server
      const { createServer } = await import("http");
      server = createServer(app);
      
      // Add minimal diagnostic endpoints
      app.get('/api/health', (req, res) => {
        res.status(200).json({ 
          status: 'ok (minimal mode)', 
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          mode: 'minimal'
        });
      });
      
      app.get('/api/diagnostics', (req, res) => {
        res.status(200).json({
          mode: 'minimal',
          databaseStatus: 'unavailable',
          error: 'Database connection failed during startup',
          timestamp: new Date().toISOString()
        });
      });
      
      console.log("✅ Minimal server configured");
      
      // Setup Vite/static serving for minimal server too
      console.log("🚀 STARTUP: Checking environment...", app.get("env"));
      if (app.get("env") === "development") {
        console.log("🚀 STARTUP: Setting up Vite (dev mode)...");
        await setupVite(app, server);
      } else {
        console.log("🚀 STARTUP: Setting up static serving (production)...");
        serveStatic(app);
      }
      console.log("🚀 STARTUP: Static/Vite setup complete!");

      // Start minimal server
      const port = process.env.PORT || 3000;
      console.log("🚀 STARTUP: Starting minimal server on port", port);
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        console.log("✅ MINIMAL SERVER STARTED: serving on port", port);
        log(`minimal server serving on port ${port}`);
      });
      
    } catch (minimalError) {
      console.error("💥 MINIMAL SERVER FAILED:", minimalError);
      process.exit(1);
    }
  }
})();
