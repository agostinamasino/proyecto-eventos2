import jwt from 'jsonwebtoken';
import config from '../config/config.js';

/**
 * Helper de JWT reutilizable (login, middleware de auth). Concentra la
 * dependencia de jsonwebtoken y el secreto/expiración leídos de las
 * variables de entorno en un solo lugar dentro de utils/.
 */
export const signToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export default { signToken, verifyToken };
