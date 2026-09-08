import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Modelo base de Evento.
 * Campos mínimos para esta etapa; en próximas entregas se sumarán las
 * sesiones/charlas del evento, el control de cupos y las inscripciones.
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
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

const Event = model('Event', eventSchema);

export default Event;
