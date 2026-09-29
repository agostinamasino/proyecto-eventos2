import ticketsDao from '../dao/tickets.dao.js';

export const create = async (ticketData, options) => {
  return ticketsDao.create(ticketData, options);
};

export const findById = async (id) => {
  return ticketsDao.findById(id);
};

export const findActiveByUserAndEvent = async (userId, eventId, options) => {
  return ticketsDao.findActiveByUserAndEvent(userId, eventId, options);
};

export const sumActiveQuantityByEvent = async (eventId, options) => {
  return ticketsDao.sumActiveQuantityByEvent(eventId, options);
};

export const findByUser = async (userId) => {
  return ticketsDao.findByUser(userId);
};

export const findByEvent = async (eventId) => {
  return ticketsDao.findByEvent(eventId);
};

export const updateById = async (id, updates) => {
  return ticketsDao.updateById(id, updates);
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
