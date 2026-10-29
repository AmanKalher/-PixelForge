/**
 * PresenceHandler
 * In-memory presence and live cursor management per board room.
 */

import { memoryStore } from '../config/db.js';

// boardId -> Map(socketId -> Collaborator)
const rooms = new Map();

// socketId -> { boardId, user }
const socketIndex = new Map();

export const PresenceHandler = {
  getRoomCollaborators(boardId) {
    const roomMap = rooms.get(boardId);
    if (!roomMap) return [];
    return Array.from(roomMap.values());
  },

  handleJoin(socket, io, payload, callback) {
    const { boardId, user = {} } = payload || {};
    if (!boardId) {
      socket.emit('error', { message: 'boardId is required to join' });
      if (typeof callback === 'function') callback({ success: false, error: 'boardId required' });
      return;
    }

    const collaboratorId = user.id || socket.id;
    const collaborator = {
      id: collaboratorId,
      socketId: socket.id,
      name: user.name || 'Anonymous Guest',
      color: user.color || '#F26B5B',
      cursor: { x: 0, y: 0 },
      lastActive: Date.now(),
    };

    if (!rooms.has(boardId)) {
      rooms.set(boardId, new Map());
    }
    const roomMap = rooms.get(boardId);
    roomMap.set(socket.id, collaborator);
    socketIndex.set(socket.id, { boardId, collaborator });

    socket.join(boardId);
    console.log(`[Socket] User "${collaborator.name}" (${socket.id}) joined board: ${boardId}`);

    const collaboratorsList = Array.from(roomMap.values());

    // Send the joining user the existing collaborators
    socket.emit('collaborators-update', collaboratorsList);

    // Send latest canvas state if available
    const latestState = memoryStore.latestFabricState.get(boardId);
    if (latestState) {
      socket.emit('canvas-synced', {
        fabricState: latestState,
        timestamp: Date.now(),
      });
    }

    // Broadcast to others in the room that a new user joined
    socket.to(boardId).emit('user-joined', collaborator);
    socket.to(boardId).emit('collaborators-update', collaboratorsList);

    if (typeof callback === 'function') {
      callback({ success: true, collaborators: collaboratorsList });
    }
  },

  handleCursorMove(socket, io, payload) {
    const { boardId, cursor } = payload || {};
    if (!boardId || !cursor) return;

    const roomMap = rooms.get(boardId);
    const collaborator = roomMap?.get(socket.id);
    if (collaborator) {
      collaborator.cursor = { x: Number(cursor.x) || 0, y: Number(cursor.y) || 0 };
      collaborator.lastActive = Date.now();

      // Broadcast low-latency cursor movement to peers
      socket.to(boardId).emit('cursor-update', {
        collaboratorId: collaborator.id,
        name: collaborator.name,
        color: collaborator.color,
        cursor: collaborator.cursor,
      });
    }
  },

  handleUserUpdate(socket, io, payload) {
    const { boardId, name, color } = payload || {};
    if (!boardId) return;

    const roomMap = rooms.get(boardId);
    const collaborator = roomMap?.get(socket.id);
    if (collaborator) {
      if (name) collaborator.name = name;
      if (color) collaborator.color = color;
      collaborator.lastActive = Date.now();

      const collaboratorsList = Array.from(roomMap.values());
      io.to(boardId).emit('collaborators-update', collaboratorsList);
    }
  },

  handleLeave(socket, io) {
    const info = socketIndex.get(socket.id);
    if (!info) return;

    const { boardId, collaborator } = info;
    const roomMap = rooms.get(boardId);
    if (roomMap) {
      roomMap.delete(socket.id);
      if (roomMap.size === 0) {
        rooms.delete(boardId);
      }
    }
    socketIndex.delete(socket.id);
    socket.leave(boardId);

    console.log(`[Socket] User "${collaborator.name}" (${socket.id}) left board: ${boardId}`);

    const remaining = roomMap ? Array.from(roomMap.values()) : [];
    socket.to(boardId).emit('user-left', { collaboratorId: collaborator.id });
    socket.to(boardId).emit('collaborators-update', remaining);
  },
};
