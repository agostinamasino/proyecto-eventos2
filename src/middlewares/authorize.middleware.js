/**
 * Middleware de autorización por roles.
 *
 * Se usa siempre DESPUÉS de `auth` (que ya validó el JWT y dejó cargado
 * `req.user`, incluyendo `req.user.role`). `authorize` no vuelve a validar
 * la sesión: solo compara el rol del usuario autenticado contra la lista
 * de roles permitidos que recibe como parámetro.
 *
 * - Si no hay `req.user` (se usó sin `auth` antes, por error) responde 401,
 *   porque en ese caso ni siquiera se pudo autenticar al usuario.
 * - Si hay usuario pero su rol no está en `allowedRoles`, responde 403:
 *   está autenticado, pero no tiene permiso para esta acción.
 *
 * Es reutilizable y genérico (no conoce rutas ni recursos concretos):
 * `authorize(['organizer', 'admin'])`, `authorize(['admin'])`, etc.
 */
const authorize = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'No autenticado' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'No tenés permisos para realizar esta acción' });
  }

  next();
};

export default authorize;
