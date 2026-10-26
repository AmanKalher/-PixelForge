import { Router } from 'express';
import { BoardController } from '../controllers/boardController.js';

const router = Router();

router.post('/', BoardController.createBoard);
router.get('/', BoardController.listBoards);
router.get('/:id', BoardController.getBoardById);
router.patch('/:id', BoardController.updateBoard);
router.delete('/:id', BoardController.deleteBoard);

export default router;
