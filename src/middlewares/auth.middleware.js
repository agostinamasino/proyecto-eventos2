import passport from '../config/passport.config.js';

/**
 * Middleware de autenticación para rutas protegidas.
 * Envuelve la estrategia 'current' de Passport (passport-jwt, que lee
 * el token de la cookie `currentUser`) para poder responder con el
 * formato JSON estándar del proyecto en vez del 401 "en blanco" que da
 * Passport por defecto. Si el token falta, es inválido o expiró, corta
 * acá con 401 antes de llegar al controller; si es válido, deja el
 * payload en req.user y sigue.
 */
const auth = (req, res, next) => {
  passport.authenticate('current', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ status: 'error', message: 'No autenticado' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

export default auth;
