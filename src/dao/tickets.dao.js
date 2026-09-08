import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import ApiError from '../utils/apiError.js';

const ensureConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'La base de datos no está disponible en este momento');
  }
};

/** DAO de tickets: única capa que conoce el modelo de Mongoose. Sin `deleteById` — cancelar es un cambio de estado, nunca un borrado. */
export const create = async (ticketData) => {
  ensureConnected();
  return Ticket.create(ticketData);
};

export const findById = async (id) => {
  ensureConnected();
  return Ticket.findById(id);
};

/** Ticket activo (no cancelado) de un usuario puntual para un evento puntual — para la regla de "no duplicados". */
export const findActiveByUserAndEvent = async (userId, eventId) => {
  ensureConnected();
  return Ticket.findOne({ user: userId, event: eventId, status: { $ne: 'cancelled' } });
};

/** Suma de `quantity` de todos los tickets activos (no cancelados) de un evento — es el cupo ya ocupado. */
export const sumActiveQuantityByEvent = async (eventId) => {
  ensureConnected();
  const result = await Ticket.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId), status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total || 0;
};

/** Tickets de un usuario, con los datos mínimos del evento poblados. */
export const findByUser = async (userId) => {
  ensureConnected();
  return Ticket.find({ user: userId }).populate('event', 'title date location').sort({ createdAt: -1 });
};

/** Tickets de un evento puntual (para el organizer dueño, o admin). */
export const findByEvent = async (eventId) => {
  ensureConnected();
  return Ticket.find({ event: eventId }).sort({ createdAt: -1 });
};

export const updateById = async (id, updates) => {
  ensureConnected();
  return Ticket.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};

export default {
  create,
  findById,
  findActiveByUserAndEvent,
  sumActiveQuantityByEvent,
  findByUser,
  findByEvent,
  updateById,
};
