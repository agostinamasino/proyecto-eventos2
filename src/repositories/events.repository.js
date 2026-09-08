import eventsDao from '../dao/events.dao.js';

export const findAll = async () => {
  return eventsDao.getAll();
};

export default { findAll };
