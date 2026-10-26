import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

export const OperationModel = {
  async record({ boardId, actorId = null, clientOperationId = null, operation = 'update', objectId = null, baseRevision = null, payload = {} }) {
    const opId = clientOperationId || `op-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const validKinds = ['create', 'update', 'delete', 'move', 'resize', 'reorder', 'clear', 'restore'];
    const normalizedKind = validKinds.includes(operation) ? operation : 'update';

    if (isDbConnected()) {
      try {
        const text = `
          INSERT INTO pixelforge.board_operations
            (board_id, actor_id, client_operation_id, operation, object_id, base_revision, payload)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (board_id, client_operation_id) DO NOTHING
          RETURNING *;
        `;
        const res = await query(text, [
          boardId,
          actorId,
          opId,
          normalizedKind,
          objectId,
          baseRevision,
          JSON.stringify(payload),
        ]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[OperationModel.record] Falling back to memoryStore:', err.message);
      }
    }

    if (!memoryStore.operations.has(boardId)) {
      memoryStore.operations.set(boardId, []);
    }
    const list = memoryStore.operations.get(boardId);
    const rec = {
      id: list.length + 1,
      board_id: boardId,
      actor_id: actorId,
      client_operation_id: opId,
      operation: normalizedKind,
      object_id: objectId,
      base_revision: baseRevision,
      payload,
      created_at: new Date().toISOString(),
    };
    list.push(rec);
    return rec;
  },

  async list(boardId, { limit = 100 } = {}) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT * FROM pixelforge.board_operations
          WHERE board_id = $1
          ORDER BY id DESC
          LIMIT $2;
        `;
        const res = await query(text, [boardId, limit]);
        return res.rows;
      } catch (err) {
        console.warn('[OperationModel.list] Falling back to memoryStore:', err.message);
      }
    }

    const list = memoryStore.operations.get(boardId) || [];
    return list.slice(-limit).reverse();
  },
};
