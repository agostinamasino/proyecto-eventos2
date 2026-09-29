/**
 * DTO de `User`. Ninguna de las tres funciones de acá abajo incluye
 * `password` bajo ningún concepto — ni siquiera hasheado —, así que da
 * igual si algún día un service se olvida de excluirlo en la consulta:
 * mientras la respuesta pase por uno de estos DTO, nunca sale.
 */

/** Usuario recién registrado — respuesta de `POST /api/sessions/register`. */
export const toPublicUser = (userDoc) => ({
  id: userDoc._id,
  first_name: userDoc.first_name,
  last_name: userDoc.last_name,
  email: userDoc.email,
  role: userDoc.role,
});

/**
 * Usuario autenticado — respuesta de `GET /api/sessions/current`. No
 * recibe un documento de Mongoose: recibe el payload ya decodificado del
 * JWT (`{ id, email, role }`, ver `middlewares/auth.middleware.js`), que
 * es exactamente lo que se guardó en el token al loguearse. Igual pasa
 * por un DTO explícito (en vez de reenviar `req.user` tal cual) para que
 * quede claro, a simple vista, qué campos expone esta ruta.
 */
export const toCurrentUser = ({ id, email, role }) => ({ id, email, role });

/** Usuario dentro del listado administrativo — respuesta de `GET /api/users`. Suma `createdAt`, que ahí sí tiene sentido mostrar. */
export const toAdminUserSummary = (userDoc) => ({
  id: userDoc._id,
  first_name: userDoc.first_name,
  last_name: userDoc.last_name,
  email: userDoc.email,
  role: userDoc.role,
  createdAt: userDoc.createdAt,
});

export default { toPublicUser, toCurrentUser, toAdminUserSummary };
