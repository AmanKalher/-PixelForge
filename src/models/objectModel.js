import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

// Map frontend ToolType or Fabric type to DB canvas_object_type enum
function normalizeObjectType(type) {
  if (!type) return 'unknown';
  const t = String(type).toLowerCase();
  if (t === 'sticky' || t === 'sticky_note') return 'sticky_note';
  if (t === 'text' || t === 'textbox') return 'text';
  if (['rectangle', 'circle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'shape', 'rounded-rectangle'].includes(t)) {
    return 'shape';
  }
  if (t === 'brush' || t === 'highlighter' || t === 'path' || t === 'freehand_stroke') {
    return 'freehand_stroke';
  }
  if (t === 'image') return 'image';
  if (t === 'group') return 'group';
  return 'unknown';
}

export const ObjectModel = {
  async getByBoardId(boardId) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT * FROM pixelforge.canvas_objects
          WHERE board_id = $1 AND deleted_at IS NULL
          ORDER BY z_index ASC, created_at ASC;
        `;
        const res = await query(text, [boardId]);
        return res.rows.map((row) => ({
          ...row.data,
          id: row.client_object_id || row.id,
          dbId: row.id,
          x: row.x,
          y: row.y,
          width: row.width,
          height: row.height,
          angle: row.angle,
          scaleX: row.scale_x,
          scaleY: row.scale_y,
          zIndex: row.z_index,
          type: row.data?.type || row.object_type,
        }));
      } catch (err) {
        console.warn('[ObjectModel.getByBoardId] Falling back to memoryStore:', err.message);
      }
    }

    const boardObjects = memoryStore.canvasObjects.get(boardId);
    if (!boardObjects) return [];
    return Array.from(boardObjects.values())
      .filter((o) => !o.deleted_at)
      .sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
  },

  async upsert(boardId, obj) {
    const clientObjectId = String(obj.id || obj.client_object_id || uuidv4());
    const objectType = normalizeObjectType(obj.type || obj.object_type);
    const x = Number(obj.x ?? obj.left ?? 0);
    const y = Number(obj.y ?? obj.top ?? 0);
    const width = obj.width !== undefined ? Number(obj.width) : null;
    const height = obj.height !== undefined ? Number(obj.height) : null;
    const angle = Number(obj.angle ?? 0);
    const scaleX = Math.max(0.001, Number(obj.scaleX ?? obj.scale_x ?? 1));
    const scaleY = Math.max(0.001, Number(obj.scaleY ?? obj.scale_y ?? 1));
    const zIndex = Number(obj.zIndex ?? obj.z_index ?? 0);
    const data = typeof obj === 'object' ? obj : {};

    if (isDbConnected()) {
      try {
        const text = `
          INSERT INTO pixelforge.canvas_objects
            (board_id, object_type, client_object_id, x, y, width, height, angle, scale_x, scale_y, z_index, data, updated_at, deleted_at)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), NULL)
          ON CONFLICT (board_id, client_object_id)
          DO UPDATE SET
            object_type = EXCLUDED.object_type,
            x = EXCLUDED.x,
            y = EXCLUDED.y,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            angle = EXCLUDED.angle,
            scale_x = EXCLUDED.scale_x,
            scale_y = EXCLUDED.scale_y,
            z_index = EXCLUDED.z_index,
            data = EXCLUDED.data,
            updated_at = now(),
            deleted_at = NULL
          RETURNING *;
        `;
        const res = await query(text, [
          boardId,
          objectType,
          clientObjectId,
          x,
          y,
          width,
          height,
          angle,
          scaleX,
          scaleY,
          zIndex,
          JSON.stringify(data),
        ]);
        return res.rows[0];
      } catch (err) {
        console.warn('[ObjectModel.upsert] Falling back to memoryStore:', err.message);
      }
    }

    if (!memoryStore.canvasObjects.has(boardId)) {
      memoryStore.canvasObjects.set(boardId, new Map());
    }
    const store = memoryStore.canvasObjects.get(boardId);
    const record = {
      id: clientObjectId,
      client_object_id: clientObjectId,
      board_id: boardId,
      object_type: objectType,
      x,
      y,
      width,
      height,
      angle,
      scale_x: scaleX,
      scale_y: scaleY,
      z_index: zIndex,
      data,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    store.set(clientObjectId, record);
    return record;
  },

  async batchUpsert(boardId, objects) {
    const results = [];
    for (const obj of objects) {
      if (obj && (obj.id || obj.client_object_id)) {
        results.push(await this.upsert(boardId, obj));
      }
    }
    return results;
  },

  async softDelete(boardId, clientObjectId) {
    if (isDbConnected()) {
      try {
        const text = `
          UPDATE pixelforge.canvas_objects
          SET deleted_at = now(), updated_at = now()
          WHERE board_id = $1 AND client_object_id = $2
          RETURNING *;
        `;
        const res = await query(text, [boardId, clientObjectId]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[ObjectModel.softDelete] Falling back to memoryStore:', err.message);
      }
    }

    const store = memoryStore.canvasObjects.get(boardId);
    if (!store) return null;
    const obj = store.get(clientObjectId);
    if (obj) {
      obj.deleted_at = new Date().toISOString();
      return obj;
    }
    return null;
  },

  async clearBoard(boardId) {
    if (isDbConnected()) {
      try {
        const text = `
          UPDATE pixelforge.canvas_objects
          SET deleted_at = now(), updated_at = now()
          WHERE board_id = $1 AND deleted_at IS NULL;
        `;
        await query(text, [boardId]);
        return true;
      } catch (err) {
        console.warn('[ObjectModel.clearBoard] Falling back to memoryStore:', err.message);
      }
    }
    const store = memoryStore.canvasObjects.get(boardId);
    if (store) {
      for (const obj of store.values()) {
        obj.deleted_at = new Date().toISOString();
      }
    }
    return true;
  },
};
