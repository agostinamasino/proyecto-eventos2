import sessionsService from '../services/sessions.service.js';

/**
 * Controlador de sesiones (autenticación).
 * Solo se ocupa de leer el request y traducir el resultado del service a
 * una respuesta HTTP; toda la lógica de negocio vive en sessions.service.js.
 */
export const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password } = req.body || {};
    const user = await sessionsService.registerUser({ first_name, last_name, email, password });
    res.status(201).json({ status: 'success', payload: user });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

// Login, current y logout se implementan en la próxima pre-entrega
// (JWT/cookies + Passport). Por ahora solo queda la estructura de rutas
// y controladores, sin lógica de autenticación.
export const login = (req, res) => {
  res.status(501).json({ status: 'error', message: 'Login: pendiente de implementar' });
};

export const current = (req, res) => {
  res.status(501).json({ status: 'error', message: 'Sesión actual: pendiente de implementar' });
};

export const logout = (req, res) => {
  res.status(501).json({ status: 'error', message: 'Logout: pendiente de implementar' });
};

export default { register, login, current, logout };
