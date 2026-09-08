import ticketsDao from '../dao/tickets.dao.js';

export const create = async (ticketData) => {
  return ticketsDao.create(ticketData);
};

export const findById = async (id) => {
  return ticketsDao.findById(id);
};

export const findActiveByUserAndEvent = async (userId, eventId) => {
  return ticketsDao.findActiveByUserAndEvent(userId, eventId);
};

export const sumActiveQuantityByEvent = async (eventId) => {
  return ticketsDao.sumActiveQuantityByEvent(eventId);
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
