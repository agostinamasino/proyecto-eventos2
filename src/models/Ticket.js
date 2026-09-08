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

const Ticket = model('Ticket', ticketSchema);

export default Ticket;
