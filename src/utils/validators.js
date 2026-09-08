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

/**
 * Valida los campos mínimos para crear/modificar un evento.
 * `partial: true` (usado en updates) solo valida los campos que vinieron,
 * sin exigir que estén todos presentes.
 */
export const validateEventFields = ({ title, date }, { partial = false } = {}) => {
  if (!partial) {
    if (!title || !date) {
      return { valid: false, message: 'Faltan campos obligatorios: title y date son requeridos' };
    }
  }

  if (date !== undefined && Number.isNaN(new Date(date).getTime())) {
    return { valid: false, message: 'El formato de la fecha (date) es inválido' };
  }

  if (title !== undefined && String(title).trim().length === 0) {
    return { valid: false, message: 'El título (title) no puede estar vacío' };
  }

  return { valid: true };
};

export default { validateRegisterFields, normalizeEmail, validateEventFields, MIN_PASSWORD_LENGTH };
