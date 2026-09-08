const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Valida los campos del registro de usuario.
 * Devuelve { valid: true } o { valid: false, message } — no lanza, para
 * que el service decida cómo comunicar el error (status code, etc.).
 */
export const validateRegisterFields = ({ first_name, last_name, email, password }) => {
  if (!first_name || !last_name || !email || !password) {
    return { valid: false, message: 'Faltan campos obligatorios' };
  }

  if (!EMAIL_REGEX.test(String(email).trim())) {
    return { valid: false, message: 'El formato del email es inválido' };
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    };
  }

  return { valid: true };
};

export const normalizeEmail = (email) => String(email).trim().toLowerCase();

export default { validateRegisterFields, normalizeEmail, MIN_PASSWORD_LENGTH };
