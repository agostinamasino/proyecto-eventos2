import usersDao from '../dao/users.dao.js';

/**
 * Repository de usuarios: capa intermedia entre el service/passport y el
 * DAO. Usa el DAO (nunca el modelo de Mongoose directamente) y expone
 * métodos orientados al dominio.
 */

/** Busca un usuario por email (normalizado por quien llama). */
export const findByEmail = async (email) => {
  return usersDao.findByEmail(email);
};

/** Crea un usuario nuevo. */
export const createUser = async (userData) => {
  return usersDao.create(userData);
};

/** Lista todos los usuarios (ruta administrativa). */
export const findAllUsers = async () => {
  return usersDao.findAll();
};

export default { findByEmail, createUser, findAllUsers };
