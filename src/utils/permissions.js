/**
 * Matriz de permisos: única fuente de verdad de "qué rol puede hacer qué
 * acción". Antes cada ruta hardcodeaba su propio array de roles
 * (`authorize(['organizer', 'admin'])` repetido en varios routers), lo que
 * dejaba la matriz de permisos repartida entre las rutas y el README, sin
 * un lugar único donde leerla o cambiarla.
 *
 * Ahora cada acción de la API tiene un nombre (`MANAGE_EVENTS`,
 * `VIEW_EVENT_TICKETS`, `VIEW_USERS`) y ese nombre mapea a los roles que
 * pueden ejecutarla. Los routers no vuelven a escribir roles: le piden a
 * `authorize` la acción por nombre (`authorize('MANAGE_EVENTS')`), y es
 * `authorize` quien consulta esta tabla (ver middlewares/authorize.middleware.js).
 *
 * Agregar una acción nueva, o cambiar quién puede hacer una existente, es
 * modificar una sola línea acá — no hay que ir a buscarla en cada router.
 */
export const PERMISSIONS = {
  // Crear, modificar o cambiar el estado de un evento (la propiedad sobre
  // un evento puntual —que un organizer solo toque los suyos— se valida
  // aparte, en el service: ver services/events.service.js).
  MANAGE_EVENTS: ['organizer', 'admin'],

  // Ver la lista de inscriptos (tickets) de un evento puntual (la
  // propiedad —que un organizer solo vea los de sus propios eventos— se
  // valida aparte, en services/tickets.service.js).
  VIEW_EVENT_TICKETS: ['organizer', 'admin'],

  // Ruta administrativa: listar todos los usuarios.
  VIEW_USERS: ['admin'],
};

/** Roles permitidos para una acción. Lanza si la acción no existe en la matriz (error de programación, no de un usuario real). */
export const rolesFor = (action) => {
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) {
    throw new Error(`Acción de permisos desconocida: "${action}". Agregala a utils/permissions.js.`);
  }
  return allowedRoles;
};

export default { PERMISSIONS, rolesFor };
