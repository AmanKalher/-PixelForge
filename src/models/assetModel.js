import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

export const AssetModel = {
  async save({ boardId, assetType = 'image', storageKey, publicUrl, mimeType, byteSize, width = null, height = null, uploadedBy = null }) {
    if (isDbConnected()) {
      try {
        const text = `
          INSERT INTO pixelforge.board_assets
            (board_id, asset_type, storage_key, public_url, mime_type, byte_size, width, height, uploaded_by)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const res = await query(text, [
          boardId,
          assetType,
          storageKey,
          publicUrl,
          mimeType,
          byteSize,
          width,
          height,
          uploadedBy,
        ]);
        return res.rows[0];
      } catch (err) {
        console.warn('[AssetModel.save] Falling back to memoryStore:', err.message);
      }
    }

    if (!memoryStore.assets.has(boardId)) {
      memoryStore.assets.set(boardId, []);
    }
    const list = memoryStore.assets.get(boardId);
    const rec = {
      id: uuidv4(),
      board_id: boardId,
      asset_type: assetType,
      storage_key: storageKey,
      public_url: publicUrl,
      mime_type: mimeType,
      byte_size: byteSize,
      width,
      height,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    };
    list.push(rec);
    return rec;
  },

  async listByBoard(boardId) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT * FROM pixelforge.board_assets
          WHERE board_id = $1
          ORDER BY created_at DESC;
        `;
        const res = await query(text, [boardId]);
        return res.rows;
      } catch (err) {
        console.warn('[AssetModel.listByBoard] Falling back to memoryStore:', err.message);
      }
    }

    return memoryStore.assets.get(boardId) || [];
  },
};
