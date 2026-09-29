import passport from '../config/passport.config.js';
import config from '../config/config.js';
import { signToken } from '../utils/jwt.js';
import { toPublicUser, toCurrentUser } from '../dto/user.dto.js';

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
 * register: toda la validación/normalización/hash/unicidad vive en la
 * estrategia 'register' de Passport (ver config/passport.config.js).
 * Este controller solo dispara esa estrategia y traduce el resultado
 * (usuario creado, o el { status, message } que la estrategia haya
 * pasado en `info`) a una respuesta HTTP.
 */
export const register = (req, res, next) => {
  passport.authenticate('register', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const status = info?.status || 400;
      return res.status(status).json({ status: 'error', message: info?.message || 'No se pudo registrar el usuario' });
    }

    res.status(201).json({ status: 'success', payload: toPublicUser(user) });
  })(req, res, next);
};

/**
 * login: la estrategia 'login' de Passport valida las credenciales
 * (busca el usuario y compara el password con bcrypt) y nunca toca JWT
 * ni cookies. Es este controller el que, recién si la autenticación fue
 * exitosa, genera el JWT y lo guarda en la cookie httpOnly.
 */
export const login = (req, res, next) => {
  passport.authenticate('login', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const status = info?.status || 401;
      return res.status(status).json({ status: 'error', message: info?.message || 'Credenciales inválidas' });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.cookie(AUTH_COOKIE_NAME, token, {
      ...authCookieOptions(),
      maxAge: 3600000, // 1 hora, en línea con JWT_EXPIRES_IN por defecto
    });

    res.status(200).json({ status: 'success', message: 'Login correcto' });
  })(req, res, next);
};

// req.user ya viene cargado por el middleware `auth`, que envuelve la
// estrategia 'current' de Passport (ver middlewares/auth.middleware.js).
export const current = (req, res) => {
  res.status(200).json({ status: 'success', payload: toCurrentUser(req.user) });
};

// Logout no pasa por Passport: solo borra la cookie.
export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};

export default { register, login, current, logout };
