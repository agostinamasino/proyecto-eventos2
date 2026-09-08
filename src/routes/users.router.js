import { Router } from 'express';
import { listUsers } from '../controllers/users.controller.js';
import auth from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';

const router = Router();

// Ruta administrativa: ver todos los usuarios. Solo admin (403 para el resto).
router.get('/', auth, authorize(['admin']), listUsers);

export default router;
