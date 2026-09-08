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

/**
 * Lista todos los usuarios (ruta administrativa). No hace falta
 * `.select('+password')` acá: al no pedirlo, el modelo ya lo excluye por
 * defecto, así que nunca viaja el hash fuera de la base.
 */
export const findAll = async () => {
  ensureConnected();
  return User.find().lean();
};

export default { findByEmail, create, findAll };
