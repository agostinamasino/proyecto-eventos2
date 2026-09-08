import usersDao from '../dao/users.dao.js';

export const findByEmail = async (email) => {
  return usersDao.findByEmail(email);
};

export const create = async (userData) => {
  return usersDao.create(userData);
};

export const findAll = async () => {
  return usersDao.findAll();
};

export default { findByEmail, create, findAll };
