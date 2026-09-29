import eventsDao from '../dao/events.dao.js';

/**
 * Repository de eventos: capa intermedia entre el service y el DAO. Usa
 * el DAO (nunca el modelo de Mongoose directamente) y traduce sus
 * operaciones genéricas (`findAll`, `count`, `updateById`) a métodos
 * orientados al dominio, que es lo que el service en realidad necesita
 * pedir: "buscá eventos con estos filtros", no "hacé un find crudo".
 */

/** Busca eventos con filtro/paginación/orden ya armados por el service (ver events.service.js: getAllEvents). */
export const searchEvents = async (options) => {
  return eventsDao.findAll(options);
};

/** Cuenta cuántos eventos matchean un filtro — para el `total`/`totalPages` del listado paginado. */
export const countEvents = async (filter) => {
  return eventsDao.count(filter);
};

/** Busca un evento puntual por id. */
export const findEventById = async (id) => {
  return eventsDao.findById(id);
};

/** Crea un evento nuevo (arranca siempre en `draft`, ver events.service.js). */
export const createEvent = async (eventData) => {
  return eventsDao.create(eventData);
};

/** Modifica campos de un evento existente (título, fecha, capacidad, o su `status`). */
export const updateEvent = async (id, updates) => {
  return eventsDao.updateById(id, updates);
};

/** "Toca" el evento dentro de una transacción, para blindar la carrera de cupos (ver tickets.service.js: createTicket). */
export const touchForCapacityLock = async (id, options) => {
  return eventsDao.touchForCapacityLock(id, options);
};

export default { searchEvents, countEvents, findEventById, createEvent, updateEvent, touchForCapacityLock };
