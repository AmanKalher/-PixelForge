import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const ShareModel = {
  async createLink({ boardId, role = 'editor', createdBy = null, expiresInHours = 168 }) {
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    if (isDbConnected()) {
      try {
        const text = `
          INSERT INTO pixelforge.board_share_links
            (board_id, token_hash, role, created_by, expires_at)
          VALUES
            ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const res = await query(text, [boardId, tokenHash, role, createdBy, expiresAt]);
        return {
          ...res.rows[0],
          rawToken,
        };
      } catch (err) {
        console.warn('[ShareModel.createLink] Falling back to memoryStore:', err.message);
      }
    }

    const record = {
      id: uuidv4(),
      board_id: boardId,
      token_hash: tokenHash,
      role,
      created_by: createdBy,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: new Date().toISOString(),
    };
    memoryStore.shareLinks.set(tokenHash, record);
    return {
      ...record,
      rawToken,
    };
  },

  async resolveToken(rawToken) {
    const tokenHash = hashToken(rawToken);
    if (isDbConnected()) {
      try {
        const text = `
          SELECT s.*, b.name AS board_name, b.is_archived
          FROM pixelforge.board_share_links s
          JOIN pixelforge.boards b ON b.id = s.board_id
          WHERE s.token_hash = $1
            AND (s.expires_at IS NULL OR s.expires_at > now())
            AND s.revoked_at IS NULL
            AND b.is_archived = false;
        `;
        const res = await query(text, [tokenHash]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[ShareModel.resolveToken] Falling back to memoryStore:', err.message);
      }
    }

    const record = memoryStore.shareLinks.get(tokenHash);
    if (!record || record.revoked_at) return null;
    if (record.expires_at && new Date(record.expires_at) < new Date()) return null;

    const board = memoryStore.boards.get(record.board_id);
    if (!board || board.is_archived) return null;

    return {
      ...record,
      board_name: board.name,
      is_archived: false,
    };
  },
};
