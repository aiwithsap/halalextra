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

// Serve static files (React build)
app.use(express.static('dist/client'));

// Catch-all for SPA routing (React Router)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist/client' });
});

const server = createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Minimal server running on port ${port}`);
});