import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware de autenticación: lee el JWT de la cookie `currentUser`,
 * lo verifica y guarda el payload ({ id, email, role }) en req.user.
 * Si no hay cookie, o el token es inválido/expiró, corta con 401 —
 * siempre con el mismo mensaje genérico, sin distinguir el motivo.
 */
const auth = (req, res, next) => {
  const token = req.cookies?.currentUser;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No autenticado' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'No autenticado' });
  }
};

export default auth;
