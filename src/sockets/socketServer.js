import { Server } from 'socket.io';
import { ENV } from '../config/env.js';
import { PresenceHandler } from './presenceHandler.js';
import { OperationHandler } from './operationHandler.js';

export function setupSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow connections from frontend dev server (e.g. localhost:5173)
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Room & Presence events
    socket.on('join-board', (payload, callback) => {
      PresenceHandler.handleJoin(socket, io, payload, callback);
    });

    socket.on('cursor-move', (payload) => {
      PresenceHandler.handleCursorMove(socket, io, payload);
    });

    socket.on('user-update', (payload) => {
      PresenceHandler.handleUserUpdate(socket, io, payload);
    });

    socket.on('leave-board', () => {
      PresenceHandler.handleLeave(socket, io);
    });

    // Real-time Canvas Operation events
    socket.on('canvas-operation', (payload) => {
      OperationHandler.handleOperation(socket, io, payload);
    });

    socket.on('sync-canvas', (payload) => {
      OperationHandler.handleCanvasSync(socket, io, payload);
    });

    socket.on('create-revision', (payload) => {
      OperationHandler.handleCreateRevision(socket, io, payload);
    });

    socket.on('disconnect', () => {
      PresenceHandler.handleLeave(socket, io);
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
