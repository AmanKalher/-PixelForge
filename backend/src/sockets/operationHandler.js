import { ObjectModel } from '../models/objectModel.js';
import { OperationModel } from '../models/operationModel.js';
import { RevisionModel } from '../models/revisionModel.js';
import { BoardModel } from '../models/boardModel.js';
import { memoryStore } from '../config/db.js';
import { LockApprovalHandler } from './lockApprovalHandler.js';

export const OperationHandler = {
  async handleOperation(socket, io, payload) {
    const { boardId, operation } = payload || {};
    if (!boardId || !operation) return;

    // Enforce lock permission check on mutations/deletions
    const targetId = operation.targetId || operation.data?.id;
    if (targetId && (operation.type === 'update' || operation.type === 'delete')) {
      try {
        const existingObj = await ObjectModel.getById(boardId, targetId);
        const isLocked = operation.data?.isPixelForgeLocked || existingObj?.isPixelForgeLocked || existingObj?.data?.isPixelForgeLocked;
        if (isLocked) {
          const actorId = operation.actorId || payload.userId || socket.id;
          const isHost = Boolean(operation.isHost || payload.isHost);
          const allowed = LockApprovalHandler.hasEditPermission(boardId, targetId, actorId, isHost);
          if (!allowed) {
            socket.emit('lock:operation-rejected', {
              targetId,
              opId: operation.opId,
              reason: 'Object is locked. Request host approval to edit.',
            });
            console.log(`[OperationHandler] Blocked unauthorized ${operation.type} on locked object "${targetId}" from actor "${actorId}"`);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('[OperationHandler] Lock verification error:', checkErr.message);
      }
    }

    // 1. Immediately broadcast operation to peers for zero perceived latency
    socket.to(boardId).emit('operation-broadcast', operation);

    // 2. Asynchronously persist operation and state change in DB/Memory
    try {
      const opType = operation.type; // 'create' | 'update' | 'delete' | 'reorder'
      const targetId = operation.targetId || operation.data?.id;

      await OperationModel.record({
        boardId,
        actorId: null,
        clientOperationId: operation.opId,
        operation: opType,
        objectId: null,
        payload: operation,
      });

      if (opType === 'delete' && targetId) {
        await ObjectModel.softDelete(boardId, targetId);
      } else if ((opType === 'create' || opType === 'update') && operation.data) {
        await ObjectModel.upsert(boardId, operation.data);
      }
    } catch (err) {
      console.warn('[OperationHandler] Persistence error:', err.message);
    }
  },

  async handleCanvasSync(socket, io, payload) {
    const { boardId, objects, fabricState } = payload || {};
    if (!boardId) return;

    try {
      if (fabricState) {
        memoryStore.latestFabricState.set(boardId, fabricState);
      }
      if (Array.isArray(objects)) {
        await ObjectModel.batchUpsert(boardId, objects);
      }

      socket.to(boardId).emit('canvas-synced', {
        objects: objects || [],
        fabricState,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[OperationHandler.handleCanvasSync] Error:', err.message);
    }
  },

  async handleCreateRevision(socket, io, payload) {
    const { boardId, kind = 'autosave', label = '', snapshot } = payload || {};
    if (!boardId) return;

    try {
      let finalSnapshot = snapshot;
      if (!finalSnapshot) {
        const objects = await ObjectModel.getByBoardId(boardId);
        finalSnapshot = { objects, count: objects.length, timestamp: Date.now() };
      }

      const rev = await RevisionModel.create({
        boardId,
        kind,
        label,
        snapshot: finalSnapshot,
      });

      io.to(boardId).emit('revision-created', rev);
    } catch (err) {
      console.warn('[OperationHandler.handleCreateRevision] Error:', err.message);
    }
  },

  async handleRenameBoard(socket, io, payload) {
    const { boardId, title } = payload || {};
    if (!boardId || !title) return;

    try {
      const trimmedTitle = String(title).trim();
      memoryStore.boardTitles.set(boardId, trimmedTitle);

      // Attempt to update board in database if board exists or fallback to memory
      await BoardModel.update(boardId, { name: trimmedTitle }).catch(() => {});

      // Broadcast renamed title to all collaborators on this board
      socket.to(boardId).emit('board-renamed', {
        boardId,
        title: trimmedTitle,
      });
      console.log(`[Socket] Board "${boardId}" renamed to: "${trimmedTitle}" by client ${socket.id}`);
    } catch (err) {
      console.warn('[OperationHandler.handleRenameBoard] Error:', err.message);
    }
  },
};
