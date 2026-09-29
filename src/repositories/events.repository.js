import eventsDao from '../dao/events.dao.js';

export const findAll = async (options) => {
  return eventsDao.findAll(options);
};

export const count = async (filter) => {
  return eventsDao.count(filter);
};

export const findById = async (id) => {
  return eventsDao.findById(id);
};

export const create = async (eventData) => {
  return eventsDao.create(eventData);
};

export const updateById = async (id, updates) => {
  return eventsDao.updateById(id, updates);
};

export const touchForCapacityLock = async (id, options) => {
  return eventsDao.touchForCapacityLock(id, options);
};

export default { findAll, count, findById, create, updateById, touchForCapacityLock };
