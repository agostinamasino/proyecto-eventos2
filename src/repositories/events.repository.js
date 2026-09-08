import eventsDao from '../dao/events.dao.js';

export const findAll = async () => {
  return eventsDao.getAll();
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

export const deleteById = async (id) => {
  return eventsDao.deleteById(id);
};

export default { findAll, findById, create, updateById, deleteById };
