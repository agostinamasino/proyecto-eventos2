import mongoose from 'mongoose';
import { TICKET_STATUSES } from '../utils/validators.js';

const { Schema, model } = mongoose;

/**
 * Modelo de Ticket (inscripción a un evento).
 * `user` y `event` son siempre referencias (ObjectId), nunca el objeto
 * embebido: para mostrar datos del evento en "mis tickets" se usa
 * `.populate('event', 'title date location')` (ver services/tickets.service.js),
 * no se copian esos datos acá.
 * `status` solo acepta los valores de TICKET_STATUSES. Cancelar es un
 * cambio de estado (`status: 'cancelled'` + `cancelledAt`), nunca se
 * borra el documento.
 */
const ticketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'confirmed',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
);

/**
 * Índice único parcial: a nivel de base de datos, no puede existir más de
 * un ticket ACTIVO (`status` distinto de `'cancelled'`) para el mismo par
 * `user`+`event`. Esto es lo que de verdad blinda la regla de "una
 * inscripción activa por usuario y evento" ante una condición de carrera
 * (dos requests casi simultáneos del mismo usuario inscribiéndose al mismo
 * evento): el chequeo en memoria de `findActiveByUserAndEvent` (en
 * services/tickets.service.js) puede pasarlo igual en ambos requests si
 * llegan lo bastante juntos, pero Mongo va a rechazar el segundo `insert`
 * con un error de clave duplicada (código 11000), que el service traduce a
 * 409 (ver el `catch` en `createTicket`). Es "parcial" porque el filtro
 * (`status: { $ne: 'cancelled' }`) hace que el índice no aplique sobre
 * tickets cancelados: un usuario puede tener muchos tickets cancelados
 * para el mismo evento, solo uno activo a la vez.
 */
ticketSchema.index(
  { user: 1, event: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

const Ticket = model('Ticket', ticketSchema);

export default Ticket;
