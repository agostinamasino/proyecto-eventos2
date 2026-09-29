import mongoose from 'mongoose';
import ticketsRepository from '../repositories/tickets.repository.js';
import eventsRepository from '../repositories/events.repository.js';
import ApiError from '../utils/apiError.js';
import { validateQuantity } from '../utils/validators.js';
import { generateReservationCode } from '../utils/reservationCode.js';
import { sendTicketConfirmationEmail } from '../utils/mailer.js';

const findEventOrFail = async (eventId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(404, 'Evento no encontrado');
  }
  const event = await eventsRepository.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Evento no encontrado');
  }
  return event;
};

const findTicketOrFail = async (ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(404, 'Ticket no encontrado');
  }
  const ticket = await ticketsRepository.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket no encontrado');
  }
  return ticket;
};

/**
 * Inscribirse a un evento (crear un ticket).
 * Reglas de negocio, en orden:
 * 1. El evento existe.
 * 2. El evento está `published` (mensajes distintos si está `cancelled`,
 *    `finished` o todavía en `draft`, aunque las tres son, en el fondo,
 *    "no está publicado").
 * 3. `quantity` es un entero > 0 (default 1 si no se manda).
 * 4. El usuario no tiene ya un ticket activo para este evento — la regla
 *    elegida es **una inscripción activa por usuario y evento**; si se
 *    quieren reservar varios lugares, se hace con `quantity` en esa
 *    única inscripción.
 * 5. Hay cupo disponible: `capacity - (suma de quantity de tickets
 *    activos)` tiene que ser >= la `quantity` pedida. Los tickets
 *    `cancelled` no cuentan como cupo ocupado.
 *
 * Carrera de cupos (dos requests simultáneos): los pasos 4 y 5 leen el
 * estado actual (¿ya tiene ticket activo?, ¿cuánto cupo queda?) y recién
 * después escriben el ticket nuevo. Si dos requests llegan casi juntos,
 * ambos pueden leer "hay cupo" antes de que ninguno haya escrito nada, y
 * los dos terminarían creando el ticket aunque solo quedara lugar para
 * uno (o el mismo usuario duplicando su inscripción). Por eso el chequeo
 * de duplicado, el chequeo de cupo y la creación del ticket corren dentro
 * de una misma transacción de MongoDB (`session.withTransaction`). Pero
 * una transacción sola NO alcanza para blindar el cupo entre dos usuarios
 * DISTINTOS: como cada uno inserta un ticket propio (documentos distintos,
 * sin ningún campo en común), MongoDB no tiene por qué detectar que las
 * dos transacciones "chocan" — las dos podrían leer "hay 1 lugar libre"
 * en paralelo y confirmar sin enterarse una de la otra, vendiendo el
 * mismo cupo dos veces. Por eso, antes de leer el cupo ocupado, la
 * transacción además "toca" el documento del evento (`eventsRepository.
 * touchForCapacityLock`, un `updateOne` que no cambia ningún dato visible)
 * — como las dos transacciones concurrentes ahora sí escriben sobre el
 * MISMO documento, MongoDB fuerza un choque real (`WriteConflict`) entre
 * ellas: una se confirma, la otra se reintenta automáticamente (lo hace
 * `withTransaction` solo) y, al reintentar, vuelve a calcular el cupo ya
 * con el ticket de la primera contado, esta vez sí detectando que no
 * queda lugar. Como defensa adicional (independiente de que las
 * transacciones estén disponibles o no), el modelo `Ticket` tiene un
 * índice único parcial sobre `user`+`event` para tickets activos (ver
 * `models/Ticket.js`): si dos inscripciones del mismo usuario al mismo
 * evento llegaran a colarse igual, Mongo rechaza el segundo `insert` con
 * un error de clave duplicada, que se traduce a 409 más abajo. Esto
 * requiere que `MONGO_URL` apunte a un replica set (MongoDB Atlas siempre
 * lo es, incluso en el plan gratuito M0) — las transacciones multi-documento
 * no existen en un Mongo standalone.
 */
export const createTicket = async (eventId, { quantity } = {}, currentUser) => {
  const event = await findEventOrFail(eventId);

  if (event.status === 'cancelled') {
    throw new ApiError(409, 'El evento está cancelado');
  }
  if (event.status === 'finished') {
    throw new ApiError(409, 'El evento ya finalizó');
  }
  if (event.status !== 'published') {
    throw new ApiError(409, 'El evento todavía no está publicado');
  }

  const requestedQuantity = quantity === undefined ? 1 : Number(quantity);
  const quantityValidation = validateQuantity(requestedQuantity);
  if (!quantityValidation.valid) {
    throw new ApiError(400, quantityValidation.message);
  }

  let session;
  let ticket;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Ver el comentario de arriba: este "toque" al evento es lo que
      // fuerza a dos inscripciones concurrentes al mismo evento a
      // chocar de verdad en Mongo, en vez de poder confirmar las dos en
      // paralelo sin verse.
      await eventsRepository.touchForCapacityLock(eventId, { session });

      const existingActiveTicket = await ticketsRepository.findActiveByUserAndEvent(currentUser.id, eventId, {
        session,
      });
      if (existingActiveTicket) {
        throw new ApiError(409, 'Ya tenés una inscripción activa para este evento');
      }

      const occupied = await ticketsRepository.sumActiveQuantityByEvent(eventId, { session });
      const available = event.capacity - occupied;
      if (available < requestedQuantity) {
        throw new ApiError(409, `No hay cupos suficientes: quedan ${Math.max(available, 0)} disponibles`);
      }

      ticket = await ticketsRepository.create(
        {
          user: currentUser.id,
          event: eventId,
          quantity: requestedQuantity,
          status: 'confirmed',
          reservationCode: generateReservationCode(),
        },
        { session }
      );
    });
  } catch (error) {
    // El índice único parcial (user+event, tickets activos) es la última
    // línea de defensa: si dos requests casi simultáneos pasaron el
    // chequeo de "no autenticado" de arriba y llegaron juntos a insertar,
    // Mongo rechaza el segundo insert con este código en vez de dejarlo
    // pasar. Se traduce al mismo 409 que el chequeo explícito, para que
    // quien llama no note la diferencia.
    if (error?.code === 11000) {
      throw new ApiError(409, 'Ya tenés una inscripción activa para este evento');
    }
    throw error;
  } finally {
    if (session) await session.endSession();
  }

  // Notificación "best effort", fuera de la transacción: si el email
  // falla, la inscripción ya quedó confirmada en la base, no se revierte
  // por esto.
  await sendTicketConfirmationEmail({
    to: currentUser.email,
    eventTitle: event.title,
    eventDate: event.date,
    quantity: ticket.quantity,
    reservationCode: ticket.reservationCode,
  });

  return ticket;
};

/** Tickets del usuario autenticado, con el evento poblado (title/date/location). */
export const getMyTickets = async (currentUser) => {
  return ticketsRepository.findByUser(currentUser.id);
};

/**
 * Tickets de un evento puntual: admin puede ver los de cualquier evento;
 * organizer solo si es el dueño de ese evento (si no, 403 — ni siquiera
 * llega a saber cuántos tickets tiene un evento ajeno).
 */
export const getEventTickets = async (eventId, currentUser) => {
  const event = await findEventOrFail(eventId);

  if (currentUser.role !== 'admin' && event.organizer?.toString() !== currentUser.id?.toString()) {
    throw new ApiError(403, 'Solo podés ver las inscripciones de tus propios eventos');
  }

  return ticketsRepository.findByEvent(eventId);
};

/**
 * Cancelar una inscripción: dueño del ticket o admin. No se puede
 * cancelar dos veces. Cambia `status` a `cancelled` y setea
 * `cancelledAt`; nunca borra el documento. Al quedar `cancelled`, deja
 * automáticamente de contar en `sumActiveQuantityByEvent`, liberando el
 * cupo para una nueva inscripción.
 */
export const cancelTicket = async (ticketId, currentUser) => {
  const ticket = await findTicketOrFail(ticketId);

  if (currentUser.role !== 'admin' && ticket.user?.toString() !== currentUser.id?.toString()) {
    throw new ApiError(403, 'Solo podés cancelar tus propias inscripciones');
  }

  if (ticket.status === 'cancelled') {
    throw new ApiError(409, 'Esta inscripción ya está cancelada');
  }

  return ticketsRepository.updateById(ticketId, { status: 'cancelled', cancelledAt: new Date() });
};

export default { createTicket, getMyTickets, getEventTickets, cancelTicket };
