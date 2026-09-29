import eventsService from '../services/events.service.js';
import { toPublicEvent } from '../dto/event.dto.js';

/** GET /api/events — pública, con filtros + paginación + orden. */
export const listEvents = async (req, res, next) => {
  try {
    const { data, page, limit, total, totalPages } = await eventsService.getAllEvents(req.query);
    res.status(200).json({
      status: 'success',
      payload: { data: data.map(toPublicEvent), page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/events/:id — pública. 404 si no existe. */
export const getEvent = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    res.status(200).json({ status: 'success', payload: toPublicEvent(event) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events — la ruta ya exigió `auth` + `authorize('MANAGE_EVENTS')`.
 * El evento queda asociado al usuario que lo crea (`organizer`).
 */
export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body || {}, req.user);
    res.status(201).json({ status: 'success', payload: toPublicEvent(event) });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id — modificar. La propiedad del recurso (organizer
 * solo puede tocar los suyos) y la regla de "cancelado no se modifica"
 * viven en el service, no acá.
 */
export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body || {}, req.user);
    res.status(200).json({ status: 'success', payload: toPublicEvent(event) });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/events/:id/status — cambiar estado (incluye cancelar). */
export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventsService.changeEventStatus(req.params.id, req.body?.status, req.user);
    res.status(200).json({ status: 'success', payload: toPublicEvent(event) });
  } catch (error) {
    next(error);
  }
};

export default { listEvents, getEvent, createEvent, updateEvent, changeEventStatus };
