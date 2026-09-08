import usersDao from '../dao/users.dao.js';

export const findByEmail = async (email) => {
  return usersDao.findByEmail(email);
};

export const create = async (userData) => {
  return usersDao.create(userData);
};

export default { findByEmail, create };
