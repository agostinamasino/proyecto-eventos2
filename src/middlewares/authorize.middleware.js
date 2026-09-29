import { rolesFor } from '../utils/permissions.js';

/**
 * Middleware de autorización por roles.
 *
 * Se usa siempre DESPUÉS de `auth` (que ya validó el JWT y dejó cargado
 * `req.user`, incluyendo `req.user.role`). `authorize` no vuelve a validar
 * la sesión: solo compara el rol del usuario autenticado contra los roles
 * permitidos para la acción pedida.
 *
 * Recibe el NOMBRE de una acción (por ejemplo `'MANAGE_EVENTS'`), no un
 * array de roles: los roles permitidos para esa acción se consultan en
 * `utils/permissions.js`, que es la única fuente de verdad de la matriz
 * de permisos. Así los routers no repiten `['organizer', 'admin']` en
 * cada ruta — solo declaran qué acción están protegiendo.
 *
 * - Si no hay `req.user` (se usó sin `auth` antes, por error) responde 401,
 *   porque en ese caso ni siquiera se pudo autenticar al usuario.
 * - Si hay usuario pero su rol no está permitido para esa acción, responde
 *   403: está autenticado, pero no tiene permiso para esta acción.
 *
 * Uso: `authorize('MANAGE_EVENTS')`, `authorize('VIEW_USERS')`, etc.
 */
const authorize = (action) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autenticado' });
  }

  const allowedRoles = rolesFor(action);

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'No tenés permisos para realizar esta acción' });
  }

  next();
};

export default authorize;
