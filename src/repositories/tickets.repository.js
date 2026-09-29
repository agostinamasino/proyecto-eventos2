import ticketsDao from '../dao/tickets.dao.js';

/**
 * Repository de tickets: capa intermedia entre el service y el DAO. Usa
 * el DAO (nunca el modelo de Mongoose directamente) y expone métodos
 * orientados al dominio en vez de operaciones CRUD genéricas — por eso
 * no exporta un `updateById` genérico: la única escritura de dominio
 * que necesita el service además de crear el ticket es "cancelarlo",
 * así que esa es la que se expone (`cancelTicket`).
 */

/** Crea un ticket nuevo. `options` puede traer `{ session }` para correr dentro de una transacción (ver tickets.service.js: createTicket). */
export const createTicket = async (ticketData, options) => {
  return ticketsDao.create(ticketData, options);
};

/** Busca un ticket puntual por id. */
export const findTicketById = async (id) => {
  return ticketsDao.findById(id);
};

/** Ticket activo (no cancelado) de un usuario puntual para un evento puntual — regla de "no duplicados". */
export const findActiveTicketByUserAndEvent = async (userId, eventId, options) => {
  return ticketsDao.findActiveByUserAndEvent(userId, eventId, options);
};

/** Cupo ya ocupado de un evento: suma de `quantity` de sus tickets activos (no cancelados). */
export const getOccupiedCapacity = async (eventId, options) => {
  return ticketsDao.sumActiveQuantityByEvent(eventId, options);
};

/** Tickets del usuario autenticado, con el evento poblado. */
export const findTicketsByUser = async (userId) => {
  return ticketsDao.findByUser(userId);
};

/** Tickets de un evento puntual (para el organizer dueño, o admin). */
export const findTicketsByEvent = async (eventId) => {
  return ticketsDao.findByEvent(eventId);
};

/** Cancela un ticket: pasa su `status` a 'cancelled' y setea `cancelledAt`. Nunca borra el documento. */
export const cancelTicket = async (ticketId) => {
  return ticketsDao.updateById(ticketId, { status: 'cancelled', cancelledAt: new Date() });
};

export default {
  createTicket,
  findTicketById,
  findActiveTicketByUserAndEvent,
  getOccupiedCapacity,
  findTicketsByUser,
  findTicketsByEvent,
  cancelTicket,
};
