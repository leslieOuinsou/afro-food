import express from 'express';
import { protegerRoute, restreindreAcces } from '../middleware/auth.js';
import { listerDocuments, refuserDocument, validerDocument } from '../controllers/documentController.js';

const router = express.Router();
router.use(protegerRoute, restreindreAcces('admin'));
router.get('/', listerDocuments);
router.post('/:jid/valider', validerDocument);
router.post('/:jid/refuser', refuserDocument);
export default router;
