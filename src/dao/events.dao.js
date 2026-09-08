import mongoose from 'mongoose';
import Event from '../models/Event.js';
import ApiError from '../utils/apiError.js';

const ensureConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'La base de datos no está disponible en este momento');
  }
};

/**
 * DAO de eventos: es la única capa que conoce el modelo de Mongoose.
 * `getAll` mantiene el comportamiento defensivo original (devuelve []
 * si todavía no hay conexión) porque es una ruta pública de solo lectura;
 * las operaciones de escritura sí exigen conexión activa (ensureConnected)
 * ya que no tiene sentido "simular éxito" al crear/modificar/borrar.
 */
export const getAll = async () => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }
  return Event.find().lean();
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

export const deleteById = async (id) => {
  ensureConnected();
  return Event.findByIdAndDelete(id);
};

export default { getAll, findById, create, updateById, deleteById };
