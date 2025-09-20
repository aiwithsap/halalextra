import express from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());

// API routes first
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Diagnostic endpoint to check Railway environment
app.get('/api/diagnostics', (req, res) => {
  // Get all environment variable names (filtered for security)
  const envKeys = Object.keys(process.env).sort();
  const filteredEnv = {};
  
  envKeys.forEach(key => {
    if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN') || key.includes('KEY')) {
      filteredEnv[key] = process.env[key] ? '***SET***' : 'MISSING';
    } else {
      filteredEnv[key] = process.env[key] || 'MISSING';
    }
  });

  res.status(200).json({
    specificVariables: {
      DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? '***SET***' : 'MISSING',
      SESSION_SECRET: process.env.SESSION_SECRET ? '***SET***' : 'MISSING',
      DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ? '***SET***' : 'MISSING'
    },
    allEnvironmentVariables: filteredEnv,
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
});

// Serve static files (React build)
app.use(express.static('dist/public'));

// Catch-all for SPA routing (React Router)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist/public' });
});

const server = createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Minimal server running on port ${port}`);
});