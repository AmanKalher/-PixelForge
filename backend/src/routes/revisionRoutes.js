import { Router } from 'express';
import { RevisionController } from '../controllers/revisionController.js';

const router = Router({ mergeParams: true });

router.get('/', RevisionController.listRevisions);
router.post('/', RevisionController.createSnapshot);
router.get('/:revisionId', RevisionController.getRevisionById);
router.post('/:revisionId/restore', RevisionController.restoreRevision);

export default router;
