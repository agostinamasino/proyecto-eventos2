import usersService from '../services/users.service.js';

/**
 * Ruta administrativa: ver todos los usuarios. La ruta ya exigió
 * `auth` + `authorize('VIEW_USERS')`, así que llegar acá ya implica que el
 * usuario está autenticado y es admin.
 */
export const listUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ status: 'success', payload: users });
  } catch (error) {
    next(error);
  }
};

export default { listUsers };
