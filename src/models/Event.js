import mongoose from 'mongoose';
import { EVENT_STATUSES } from '../utils/validators.js';

const { Schema, model } = mongoose;

/**
 * Modelo de Evento.
 * `organizer` es una referencia (ObjectId) al usuario que creó el
 * evento, nunca el objeto embebido: al crear/modificar siempre se guarda
 * (y se puebla, si hace falta, con `.populate('organizer')`) el id del
 * usuario, no una copia de sus datos.
 * `status` solo acepta los valores de EVENT_STATUSES (ver utils/validators.js,
 * que es la única fuente de verdad para no duplicar el enum en dos lugares).
 */
const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'draft',
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

const Event = model('Event', eventSchema);

export default Event;
