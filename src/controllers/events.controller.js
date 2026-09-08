import eventsService from '../services/events.service.js';

/**
 * Deja un evento listo para responder con `id` (string) en vez del `_id`
 * (ObjectId) crudo de Mongoose, para que el contrato de la API sea
 * consistente con el resto de las respuestas (por ejemplo, `sessions`).
 */
const toPublicEvent = (eventDoc) => ({
  id: eventDoc._id,
  title: eventDoc.title,
  description: eventDoc.description,
  date: eventDoc.date,
  location: eventDoc.location,
  capacity: eventDoc.capacity,
  organizer: eventDoc.organizer,
});

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getAllEvents();
    res.status(200).json({ status: 'success', payload: events });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear evento: la ruta ya exigió `auth` + `authorize(['organizer','admin'])`,
 * así que acá req.user siempre existe y tiene un rol permitido. El evento
 * queda asociado al usuario que lo crea (`organizer`).
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
 * Modificar evento: la validación de "es organizer y no es el dueño" vive
 * en el service (assertCanManageEvent), porque necesita ir a buscar el
 * evento a la base para saber quién es el dueño — no se puede resolver
 * solo con el rol, a diferencia de `authorize`.
 */
export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body || {}, req.user);
    res.status(200).json({ status: 'success', payload: toPublicEvent(event) });
  } catch (error) {
    next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    await eventsService.cancelEvent(req.params.id, req.user);
    res.status(200).json({ status: 'success', message: 'Evento cancelado' });
  } catch (error) {
    next(error);
  }
};

export default { getEvents, createEvent, updateEvent, cancelEvent };
