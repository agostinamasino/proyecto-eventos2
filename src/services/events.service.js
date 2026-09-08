import mongoose from 'mongoose';
import eventsRepository from '../repositories/events.repository.js';
import ApiError from '../utils/apiError.js';
import { validateEventFields, validateEventStatus, escapeRegex } from '../utils/validators.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Whitelist de campos por los que se puede ordenar, para no aceptar
// cualquier string del query como clave de sort de Mongo.
const SORTABLE_FIELDS = ['date', 'price', 'capacity', 'createdAt', 'title'];

const buildSort = (sortParam) => {
  if (!sortParam) return { date: 1 };
  const direction = sortParam.startsWith('-') ? -1 : 1;
  const field = sortParam.replace(/^-/, '');
  if (!SORTABLE_FIELDS.includes(field)) {
    return { date: 1 };
  }
  return { [field]: direction };
};

/**
 * Listado de eventos con filtros, paginación y orden.
 * Filtros soportados: status, category, location (estas dos por
 * coincidencia insensible a mayúsculas), y rango de fechas dateFrom/dateTo.
 * Devuelve { data, page, limit, total, totalPages }, como pide la consigna.
 */
export const getAllEvents = async (query = {}) => {
  const { status, category, location, dateFrom, dateTo, page, limit, sort } = query;
  const filter = {};

  if (status !== undefined) {
    const statusValidation = validateEventStatus(status);
    if (!statusValidation.valid) {
      throw new ApiError(400, statusValidation.message);
    }
    filter.status = status;
  }

  if (category) {
    filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
  }

  if (location) {
    filter.location = { $regex: escapeRegex(location), $options: 'i' };
  }

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) {
      const parsedFrom = new Date(dateFrom);
      if (Number.isNaN(parsedFrom.getTime())) {
        throw new ApiError(400, 'El formato de dateFrom es inválido');
      }
      filter.date.$gte = parsedFrom;
    }
    if (dateTo) {
      const parsedTo = new Date(dateTo);
      if (Number.isNaN(parsedTo.getTime())) {
        throw new ApiError(400, 'El formato de dateTo es inválido');
      }
      filter.date.$lte = parsedTo;
    }
  }

  const parsedPage = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (parsedPage - 1) * parsedLimit;
  const sortObj = buildSort(sort);

  const [data, total] = await Promise.all([
    eventsRepository.findAll({ filter, skip, limit: parsedLimit, sort: sortObj }),
    eventsRepository.count(filter),
  ]);

  return {
    data,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / parsedLimit),
  };
};

/**
 * Busca un evento por id, o corta con 404 (id con formato inválido
 * incluido) en vez de dejar que explote como 500.
 */
const findEventOrFail = async (eventId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(404, 'Evento no encontrado');
  }

  const event = await eventsRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Evento no encontrado');
  }

  return event;
};

export const getEventById = async (eventId) => {
  return findEventOrFail(eventId);
};

/**
 * admin puede modificar cualquier evento; organizer solo los que él mismo
 * creó (el rol `user` ya fue bloqueado antes, por `authorize`, en la ruta).
 */
const assertCanManageEvent = (event, currentUser) => {
  if (currentUser.role === 'admin') {
    return;
  }

  if (event.organizer?.toString() !== currentUser.id?.toString()) {
    throw new ApiError(403, 'Solo podés modificar tus propios eventos');
  }
};

/**
 * Crear evento: `organizer` se asigna siempre desde `currentUser`, nunca
 * se lee del body (aunque venga, se ignora). `status` tampoco se toma del
 * body: todo evento nuevo arranca en `draft`, hay que publicarlo
 * explícitamente con `changeEventStatus`.
 */
export const createEvent = async ({ title, description, category, date, location, capacity, price }, currentUser) => {
  const validation = validateEventFields({ title, description, category, date, location, capacity, price });
  if (!validation.valid) {
    throw new ApiError(400, validation.message);
  }

  return eventsRepository.create({
    title: String(title).trim(),
    description: String(description).trim(),
    category: String(category).trim(),
    date,
    location: String(location).trim(),
    capacity,
    price: price ?? 0,
    organizer: currentUser.id,
  });
};

/**
 * Modificar evento. Un evento cancelado no se puede modificar (regla de
 * negocio explícita de esta entrega): la única forma de "reabrirlo"
 * sería crear uno nuevo, para no perder la trazabilidad de que ese
 * evento puntual fue cancelado.
 */
export const updateEvent = async (eventId, updates, currentUser) => {
  const event = await findEventOrFail(eventId);
  assertCanManageEvent(event, currentUser);

  if (event.status === 'cancelled') {
    throw new ApiError(409, 'No se puede modificar un evento cancelado');
  }

  const { title, description, category, date, location, capacity, price } = updates;
  const validation = validateEventFields({ title, description, category, date, location, capacity, price }, { partial: true });
  if (!validation.valid) {
    throw new ApiError(400, validation.message);
  }

  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = String(title).trim();
  if (description !== undefined) allowedUpdates.description = String(description).trim();
  if (category !== undefined) allowedUpdates.category = String(category).trim();
  if (date !== undefined) allowedUpdates.date = date;
  if (location !== undefined) allowedUpdates.location = String(location).trim();
  if (capacity !== undefined) allowedUpdates.capacity = capacity;
  if (price !== undefined) allowedUpdates.price = price;

  return eventsRepository.updateById(eventId, allowedUpdates);
};

/**
 * Cambiar el estado de un evento (incluye "cancelar": status = 'cancelled').
 * Reglas de negocio:
 * - Un evento cancelado no puede cambiar de estado nunca más.
 * - No se puede publicar (status: 'published') un evento que ya está
 *   finalizado o cancelado.
 */
export const changeEventStatus = async (eventId, newStatus, currentUser) => {
  const event = await findEventOrFail(eventId);
  assertCanManageEvent(event, currentUser);

  const statusValidation = validateEventStatus(newStatus);
  if (!statusValidation.valid) {
    throw new ApiError(400, statusValidation.message);
  }

  if (event.status === 'cancelled') {
    throw new ApiError(409, 'No se puede modificar el estado de un evento cancelado');
  }

  if (newStatus === 'published' && event.status === 'finished') {
    throw new ApiError(409, 'No se puede publicar un evento ya finalizado');
  }

  return eventsRepository.updateById(eventId, { status: newStatus });
};

export default { getAllEvents, getEventById, createEvent, updateEvent, changeEventStatus };
