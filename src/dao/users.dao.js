import mongoose from 'mongoose';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';

const ensureConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'La base de datos no está disponible en este momento');
  }
};

/**
 * DAO de usuarios: única capa que conoce el modelo de Mongoose.
 * `findByEmail` trae explícitamente el password (+password) porque el
 * modelo lo excluye por defecto (select: false) y el service lo necesita
 * para, más adelante, comparar contraseñas en el login.
 */
export const findByEmail = async (email) => {
  ensureConnected();
  return User.findOne({ email }).select('+password');
};

export const create = async (userData) => {
  ensureConnected();
  return User.create(userData);
};

export default { findByEmail, create };
