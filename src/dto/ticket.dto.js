import { toEventSummary } from './event.dto.js';

/**
 * DTO de `Ticket`. `user` y `event` viajan como referencias (ids) salvo
 * que el documento venga con `event` poblado (`.populate('event', ...)`,
 * ver `dao/tickets.dao.js`), en cuyo caso `toMyTicket` lo pasa por el DTO
 * de evento (`toEventSummary`) en vez de exponer el documento poblado
 * tal cual — así, si el día de mañana `Event` tuviera un campo sensible,
 * nunca se filtraría por acá sin querer.
 */

/** Ticket "plano", con `user`/`event` como ids — para las rutas que no necesitan el detalle del evento. */
export const toPublicTicket = (ticketDoc) => ({
  id: ticketDoc._id,
  user: ticketDoc.user,
  event: ticketDoc.event,
  status: ticketDoc.status,
  quantity: ticketDoc.quantity,
  reservationCode: ticketDoc.reservationCode,
  createdAt: ticketDoc.createdAt,
  cancelledAt: ticketDoc.cancelledAt,
});

/** Ticket con el evento poblado (a través de `toEventSummary`) — para "mis tickets". */
export const toMyTicket = (ticketDoc) => ({
  id: ticketDoc._id,
  status: ticketDoc.status,
  quantity: ticketDoc.quantity,
  reservationCode: ticketDoc.reservationCode,
  createdAt: ticketDoc.createdAt,
  cancelledAt: ticketDoc.cancelledAt,
  event: ticketDoc.event ? toEventSummary(ticketDoc.event) : null,
});

export default { toPublicTicket, toMyTicket };
