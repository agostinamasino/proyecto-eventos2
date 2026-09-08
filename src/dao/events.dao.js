import mongoose from 'mongoose';
import Event from '../models/Event.js';

/**
 * DAO de eventos: es la única capa que conoce el modelo de Mongoose.
 * Mientras no haya una conexión activa a la base de datos (etapa inicial
 * del proyecto, sin lógica de negocio todavía), devuelve una lista vacía
 * en lugar de fallar, para que el servidor sea utilizable desde el inicio.
 */
export const getAll = async () => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }
  return Event.find().lean();
};

export default { getAll };
