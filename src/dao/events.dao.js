import mongoose from 'mongoose';
import Event from '../models/Event.js';
import ApiError from '../utils/apiError.js';

const ensureConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'La base de datos no está disponible en este momento');
  }
};

/**
 * DAO de eventos: única capa que conoce el modelo de Mongoose.
 * `findAll`/`count` son de solo lectura y devuelven un resultado vacío
 * si todavía no hay conexión (para que el listado público siga
 * respondiendo aunque la base esté caída); las operaciones de escritura
 * sí exigen conexión activa.
 *
 * A propósito NO existe un `deleteById`: los eventos nunca se borran
 * físicamente, "cancelar" es cambiar `status` a `cancelled` (ver
 * `services/events.service.js`).
 */
export const findAll = async ({ filter = {}, skip = 0, limit = 10, sort = { date: 1 } } = {}) => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }
  return Event.find(filter).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (filter = {}) => {
  if (mongoose.connection.readyState !== 1) {
    return 0;
  }
  return Event.countDocuments(filter);
};

export const findById = async (id) => {
  ensureConnected();
  return Event.findById(id);
};

export const create = async (eventData) => {
  ensureConnected();
  return Event.create(eventData);
};

export const updateById = async (id, updates) => {
  ensureConnected();
  return Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};

export default { findAll, count, findById, create, updateById };
