import { Router } from 'express';
import { getEvents, createEvent, updateEvent, cancelEvent } from '../controllers/events.controller.js';
import auth from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';

const router = Router();

// Pública: cualquiera puede consultar los eventos publicados.
router.get('/', getEvents);

// Crear evento: requiere sesión y rol organizer o admin (403 para user).
router.post('/', auth, authorize(['organizer', 'admin']), createEvent);

// Modificar/cancelar: requiere sesión y rol organizer o admin. La
// propiedad del recurso (organizer solo puede tocar los suyos) se valida
// dentro del service, no acá.
router.patch('/:id', auth, authorize(['organizer', 'admin']), updateEvent);
router.delete('/:id', auth, authorize(['organizer', 'admin']), cancelEvent);

export default router;
