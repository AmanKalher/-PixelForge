import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

export const RevisionModel = {
  async create({ boardId, kind = 'autosave', label = '', snapshot = {}, createdBy = null }) {
    if (isDbConnected()) {
      try {
        // Get next revision number
        const nextRevRes = await query(
          `SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_rev FROM pixelforge.board_revisions WHERE board_id = $1;`,
          [boardId]
        );
        const revisionNumber = nextRevRes.rows[0].next_rev;

        const text = `
          INSERT INTO pixelforge.board_revisions
            (board_id, revision_number, kind, label, snapshot, created_by)
          VALUES
            ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
        const res = await query(text, [
          boardId,
          revisionNumber,
          kind,
          label || `${kind.toUpperCase()} - ${new Date().toLocaleTimeString()}`,
          JSON.stringify(snapshot),
          createdBy,
        ]);
        return res.rows[0];
      } catch (err) {
        console.warn('[RevisionModel.create] Falling back to memoryStore:', err.message);
      }
    }

    if (!memoryStore.revisions.has(boardId)) {
      memoryStore.revisions.set(boardId, []);
    }
    const list = memoryStore.revisions.get(boardId);
    const revisionNumber = list.length + 1;
    const rev = {
      id: uuidv4(),
      board_id: boardId,
      revision_number: revisionNumber,
      kind,
      label: label || `${kind.toUpperCase()} - ${new Date().toLocaleTimeString()}`,
      snapshot,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };
    list.unshift(rev);
    return rev;
  },

  async list(boardId, { limit = 20, offset = 0 } = {}) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT id, board_id, revision_number, kind, label, created_by, created_at
          FROM pixelforge.board_revisions
          WHERE board_id = $1
          ORDER BY revision_number DESC
          LIMIT $2 OFFSET $3;
        `;
        const res = await query(text, [boardId, limit, offset]);
        return res.rows;
      } catch (err) {
        console.warn('[RevisionModel.list] Falling back to memoryStore:', err.message);
      }
    }

    const list = memoryStore.revisions.get(boardId) || [];
    return list.slice(offset, offset + limit).map((r) => {
      const { snapshot, ...metadata } = r;
      return metadata;
    });
  },

  async getById(boardId, revisionId) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT * FROM pixelforge.board_revisions
          WHERE board_id = $1 AND (id = $2 OR revision_number::text = $2);
        `;
        const res = await query(text, [boardId, revisionId]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[RevisionModel.getById] Falling back to memoryStore:', err.message);
      }
    }

    const list = memoryStore.revisions.get(boardId) || [];
    return (
      list.find((r) => r.id === revisionId || String(r.revision_number) === String(revisionId)) ||
      null
    );
  },
};
