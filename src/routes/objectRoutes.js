import { Router } from 'express';
import { ObjectController } from '../controllers/objectController.js';

const router = Router({ mergeParams: true });

router.get('/', ObjectController.getObjects);
router.post('/', ObjectController.upsertObject);
router.post('/sync', ObjectController.syncObjects);
router.delete('/:objectId', ObjectController.deleteObject);
router.delete('/', ObjectController.clearBoard);

export default router;
