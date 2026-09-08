import { Router } from 'express';
import { listEvents, getEvent, createEvent, updateEvent, changeEventStatus } from '../controllers/events.controller.js';
import auth from '../middlewares/auth.middleware.js';
import authorize from '../middlewares/authorize.middleware.js';

const router = Router();

// Públicas: cualquiera puede listar y consultar el detalle de un evento.
router.get('/', listEvents);
router.get('/:id', getEvent);

// Crear: requiere sesión y rol organizer o admin (403 para user).
router.post('/', auth, authorize(['organizer', 'admin']), createEvent);

// Modificar / cambiar estado: requiere sesión y rol organizer o admin.
// La propiedad del recurso (organizer solo sobre los suyos) y las reglas
// de negocio (evento cancelado, publicar uno finalizado, etc.) se
// validan dentro del service, no acá.
router.put('/:id', auth, authorize(['organizer', 'admin']), updateEvent);
router.patch('/:id/status', auth, authorize(['organizer', 'admin']), changeEventStatus);

export default router;
