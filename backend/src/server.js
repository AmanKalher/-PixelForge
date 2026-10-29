import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { setupSocketServer } from './sockets/socketServer.js';

const server = http.createServer(app);

// Setup real-time Socket.IO collaboration
const io = setupSocketServer(server);

// Start server
async function startServer() {
  // Attempt PostgreSQL connection check
  await checkDbConnection();

  const PORT = ENV.PORT;
  const HOST = '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 PixelForge Backend running on http://${HOST}:${PORT}`);
    console.log(`📡 Socket.IO server ready for real-time collaboration`);
    console.log(`🌐 Local Network URL: http://10.53.80.40:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

// Graceful shutdown
function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();
