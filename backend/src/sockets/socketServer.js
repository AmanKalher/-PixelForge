import { Server } from 'socket.io';
import * as Y from 'yjs';
import { ENV } from '../config/env.js';
import { PresenceHandler } from './presenceHandler.js';
import { OperationHandler } from './operationHandler.js';
import { LockApprovalHandler } from './lockApprovalHandler.js';
import { memoryStore } from '../config/db.js';

export function setupSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true, // Allow connections from localhost:5173, 10.53.80.40:5173, etc.
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

    socket.on('rename-board', (payload) => {
      OperationHandler.handleRenameBoard(socket, io, payload);
    });

    // Host Lock Approval Workflow events
    socket.on('lock:request-access', (payload) => {
      LockApprovalHandler.handleRequestAccess(socket, io, payload);
    });

    socket.on('lock:approve-access', (payload) => {
      LockApprovalHandler.handleApproveAccess(socket, io, payload);
    });

    socket.on('lock:reject-access', (payload) => {
      LockApprovalHandler.handleRejectAccess(socket, io, payload);
    });

    socket.on('lock:release-access', (payload) => {
      LockApprovalHandler.handleReleaseAccess(socket, io, payload);
    });

    // Collaboration Chat events
    socket.on('chat:send-message', (payload) => {
      LockApprovalHandler.handleChatMessage(socket, io, payload);
    });

    socket.on('chat:fetch-history', (payload, callback) => {
      LockApprovalHandler.handleFetchChatHistory(socket, io, payload, callback);
    });

    // Yjs Synchronization & Protocol Relay (pf:*)
    socket.on('pf:join', (payload) => {
      const room = payload?.room;
      if (!room) return;
      socket.join(room);
      console.log(`[Socket] pf:join client ${socket.id} joined Yjs room: ${room}`);

      // If server has stored Yjs state for this room, sync it to the newcomer
      const ydoc = memoryStore.yjsDocs.get(room);
      if (ydoc) {
        const update = Array.from(Y.encodeStateAsUpdate(ydoc));
        socket.emit('pf:y-update', { room, update });
      }
    });

    socket.on('pf:y-update', (payload) => {
      const { room, update } = payload || {};
      if (!room || !update) return;

      // Broadcast update to all other room members
      socket.to(room).emit('pf:y-update', { room, update });

      // Apply to server Y.Doc memory store
      let ydoc = memoryStore.yjsDocs.get(room);
      if (!ydoc) {
        ydoc = new Y.Doc();
        memoryStore.yjsDocs.set(room, ydoc);
      }
      try {
        const updateBytes = Array.isArray(update) ? Uint8Array.from(update) : new Uint8Array(update);
        Y.applyUpdate(ydoc, updateBytes, 'socket');
      } catch (err) {
        console.warn('[Socket pf:y-update] Error applying Yjs update:', err.message);
      }
    });

    socket.on('pf:cursor', (payload) => {
      const room = payload?.room;
      if (!room) return;
      socket.to(room).emit('pf:cursor', payload);
    });

    socket.on('pf:ping', (payload) => {
      socket.emit('pf:pong', { sentAt: payload?.sentAt });
    });

    socket.on('disconnect', () => {
      PresenceHandler.handleLeave(socket, io);
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
