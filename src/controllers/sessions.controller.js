import sessionsService from '../services/sessions.service.js';
import config from '../config/config.js';

const AUTH_COOKIE_NAME = 'currentUser';

/**
 * Opciones de la cookie de autenticación. `secure: true` solo en
 * producción (en dev, sobre http, el navegador descartaría la cookie
 * si se pidiera secure).
 */
const authCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
});

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

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const token = await sessionsService.loginUser({ email, password });

    res.cookie(AUTH_COOKIE_NAME, token, {
      ...authCookieOptions(),
      maxAge: 3600000, // 1 hora, en línea con JWT_EXPIRES_IN por defecto
    });

    res.status(200).json({ status: 'success', message: 'Login correcto' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

// req.user ya viene cargado por el middleware `auth` (ver
// middlewares/auth.middleware.js), que verificó el JWT de la cookie
// antes de dejar pasar la request hasta acá.
export const current = (req, res) => {
  const { id, email, role } = req.user;
  res.status(200).json({ status: 'success', payload: { id, email, role } });
};

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};

export default { register, login, current, logout };
