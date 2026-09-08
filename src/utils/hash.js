import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Helper de hashing reutilizable en toda la app (registro, login, cambio
 * de contraseña, etc.). Concentra la dependencia de bcrypt en un solo
 * lugar dentro de utils/.
 */
export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export default { hashPassword, comparePassword };
