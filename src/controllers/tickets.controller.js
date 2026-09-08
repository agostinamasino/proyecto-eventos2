import ticketsService from '../services/tickets.service.js';

/** Ticket "plano", con `user`/`event` como ids — para las rutas que no necesitan el detalle del evento. */
const toPublicTicket = (ticketDoc) => ({
  id: ticketDoc._id,
  user: ticketDoc.user,
  event: ticketDoc.event,
  status: ticketDoc.status,
  quantity: ticketDoc.quantity,
  reservationCode: ticketDoc.reservationCode,
  createdAt: ticketDoc.createdAt,
  cancelledAt: ticketDoc.cancelledAt,
});

/** Ticket con el evento poblado (solo title/date/location) — para "mis tickets". */
const toMyTicket = (ticketDoc) => ({
  id: ticketDoc._id,
  status: ticketDoc.status,
  quantity: ticketDoc.quantity,
  reservationCode: ticketDoc.reservationCode,
  createdAt: ticketDoc.createdAt,
  cancelledAt: ticketDoc.cancelledAt,
  event: ticketDoc.event
    ? {
        id: ticketDoc.event._id,
        title: ticketDoc.event.title,
        date: ticketDoc.event.date,
        location: ticketDoc.event.location,
      }
    : null,
});

/** POST /api/events/:eid/tickets — inscribirse a un evento. Cualquier usuario autenticado. */
export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.createTicket(req.params.eid, req.body || {}, req.user);
    res.status(201).json({ status: 'success', payload: toPublicTicket(ticket) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/tickets/my-tickets — tickets propios, con el evento poblado. Nunca expone datos de otros usuarios. */
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user);
    res.status(200).json({ status: 'success', payload: tickets.map(toMyTicket) });
  } catch (error) {
    next(error);
  }
};

/** GET /api/events/:eid/tickets — organizer dueño del evento, o admin. */
export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getEventTickets(req.params.eid, req.user);
    res.status(200).json({ status: 'success', payload: tickets.map(toPublicTicket) });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/tickets/:tid/cancel — dueño del ticket, o admin. */
export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.cancelTicket(req.params.tid, req.user);
    res.status(200).json({ status: 'success', payload: toPublicTicket(ticket) });
  } catch (error) {
    next(error);
  }
};

export default { createTicket, getMyTickets, getEventTickets, cancelTicket };
