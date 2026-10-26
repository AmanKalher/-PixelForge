import { RevisionModel } from '../models/revisionModel.js';
import { ObjectModel } from '../models/objectModel.js';

export const RevisionController = {
  async listRevisions(req, res, next) {
    try {
      const { boardId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const revisions = await RevisionModel.list(boardId, { limit, offset });
      res.json({ success: true, count: revisions.length, data: revisions });
    } catch (err) {
      next(err);
    }
  },

  async getRevisionById(req, res, next) {
    try {
      const { boardId, revisionId } = req.params;
      const revision = await RevisionModel.getById(boardId, revisionId);
      if (!revision) {
        return res.status(404).json({ success: false, error: 'Revision not found' });
      }
      res.json({ success: true, data: revision });
    } catch (err) {
      next(err);
    }
  },

  async createSnapshot(req, res, next) {
    try {
      const { boardId } = req.params;
      const { kind = 'manual', label = '', snapshot } = req.body;

      // If snapshot wasn't provided in body, gather current board objects
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

      res.status(201).json({ success: true, data: rev });
    } catch (err) {
      next(err);
    }
  },

  async restoreRevision(req, res, next) {
    try {
      const { boardId, revisionId } = req.params;
      const revision = await RevisionModel.getById(boardId, revisionId);
      if (!revision) {
        return res.status(404).json({ success: false, error: 'Revision not found' });
      }

      const snapshot = revision.snapshot;
      const objects = Array.isArray(snapshot) ? snapshot : (snapshot.objects || []);

      // Clear existing canvas objects and batch insert restored snapshot
      await ObjectModel.clearBoard(boardId);
      await ObjectModel.batchUpsert(boardId, objects);

      // Create a 'restore' checkpoint revision
      const restoreRecord = await RevisionModel.create({
        boardId,
        kind: 'restore',
        label: `Restored to Revision #${revision.revision_number} (${revision.label || revision.kind})`,
        snapshot: { objects, restoredFrom: revision.id },
      });

      res.json({
        success: true,
        message: `Successfully restored board to revision #${revision.revision_number}`,
        restoredObjectsCount: objects.length,
        restoreRevision: restoreRecord,
      });
    } catch (err) {
      next(err);
    }
  },
};
