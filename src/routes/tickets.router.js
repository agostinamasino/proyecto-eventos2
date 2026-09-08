import { Router } from 'express';
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

// Mis inscripciones: cualquier usuario autenticado, solo ve las propias.
router.get('/my-tickets', auth, getMyTickets);

// Cancelar: dueño del ticket o admin (la comparación de dueño vive en el service).
router.patch('/:tid/cancel', auth, cancelTicket);

export default router;
