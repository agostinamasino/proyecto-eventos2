import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Modelo de Usuario.
 * `password` siempre se guarda hasheada (ver utils/hash.js) y se excluye
 * por defecto de las consultas (select: false) como capa extra de
 * seguridad, además de que el service nunca la incluye en las respuestas.
 * `role` no puede setearse desde el registro público: el service arma el
 * documento a crear sin tomar ese campo del body.
 */
const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

const User = model('User', userSchema);

export default User;
