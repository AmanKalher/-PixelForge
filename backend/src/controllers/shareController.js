import { ShareModel } from '../models/shareModel.js';
import { BoardModel } from '../models/boardModel.js';

export const ShareController = {
  async createShareLink(req, res, next) {
    try {
      const { id: boardId } = req.params;
      const { role = 'editor', expiresInHours = 168 } = req.body;

      const board = await BoardModel.getById(boardId);
      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const link = await ShareModel.createLink({
        boardId,
        role,
        expiresInHours,
      });

      res.status(201).json({
        success: true,
        data: {
          shareId: link.id,
          boardId: link.board_id,
          role: link.role,
          token: link.rawToken,
          expiresAt: link.expires_at,
          inviteUrl: `${req.protocol}://${req.get('host')}/api/share/${link.rawToken}`,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async resolveShareLink(req, res, next) {
    try {
      const { token } = req.params;
      const shareRecord = await ShareModel.resolveToken(token);
      if (!shareRecord) {
        return res.status(404).json({
          success: false,
          error: 'Invitation link is invalid, expired, or revoked',
        });
      }

      const board = await BoardModel.getById(shareRecord.board_id);
      res.json({
        success: true,
        data: {
          boardId: shareRecord.board_id,
          boardName: board?.name || shareRecord.board_name,
          role: shareRecord.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
