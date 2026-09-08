import { Router } from 'express';
import { listEvents, getEvent, createEvent, updateEvent, changeEventStatus } from '../controllers/events.controller.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';
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

// Inscripciones (tickets) de un evento puntual. Inscribirse es para
// cualquier usuario autenticado (no requiere un rol en particular); ver
// la lista de inscriptos es solo para el organizer dueño del evento o admin
// (esa comparación de "dueño" vive en tickets.service.js, no acá).
router.post('/:eid/tickets', auth, createTicket);
router.get('/:eid/tickets', auth, authorize(['organizer', 'admin']), getEventTickets);

export default router;
