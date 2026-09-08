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
 * Estados válidos de un evento. Vive acá (capa de validación/utils) y
 * `models/Event.js` lo importa, para tener una única fuente de verdad
 * entre el enum del schema y las validaciones de negocio del service.
 */
export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'finished'];

/**
 * Valida los campos de un evento para crear/modificar.
 * `partial: true` (usado en updates) solo valida los campos que vinieron,
 * sin exigir que estén todos presentes. Reglas de negocio (no fecha
 * pasada, capacity > 0, price >= 0) están acá porque aplican tanto a la
 * creación como a la modificación de un evento.
 */
export const validateEventFields = (
  { title, description, category, date, location, capacity, price },
  { partial = false } = {}
) => {
  if (!partial) {
    if (!title || !description || !category || !date || !location || capacity === undefined) {
      return {
        valid: false,
        message: 'Faltan campos obligatorios: title, description, category, date, location y capacity son requeridos',
      };
    }
  }

  if (title !== undefined && String(title).trim().length === 0) {
    return { valid: false, message: 'El título (title) no puede estar vacío' };
  }

  if (description !== undefined && String(description).trim().length === 0) {
    return { valid: false, message: 'La descripción (description) no puede estar vacía' };
  }

  if (category !== undefined && String(category).trim().length === 0) {
    return { valid: false, message: 'La categoría (category) no puede estar vacía' };
  }

  if (location !== undefined && String(location).trim().length === 0) {
    return { valid: false, message: 'La ubicación (location) no puede estar vacía' };
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return { valid: false, message: 'El formato de la fecha (date) es inválido' };
    }
    if (parsedDate.getTime() < Date.now()) {
      return { valid: false, message: 'La fecha del evento no puede ser en el pasado' };
    }
  }

  if (capacity !== undefined) {
    const numericCapacity = Number(capacity);
    if (Number.isNaN(numericCapacity) || numericCapacity <= 0) {
      return { valid: false, message: 'La capacidad (capacity) debe ser un número mayor a 0' };
    }
  }

  if (price !== undefined) {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return { valid: false, message: 'El precio (price) no puede ser negativo' };
    }
  }

  return { valid: true };
};

/** Valida que `status` sea uno de los valores permitidos del enum. */
export const validateEventStatus = (status) => {
  if (!EVENT_STATUSES.includes(status)) {
    return { valid: false, message: `El estado (status) debe ser uno de: ${EVENT_STATUSES.join(', ')}` };
  }
  return { valid: true };
};

/** Escapa caracteres especiales de regex antes de usar un input de usuario en un filtro $regex de Mongo. */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Estados válidos de un ticket/inscripción. Misma idea que EVENT_STATUSES:
 * única fuente de verdad, importada por `models/Ticket.js` para el enum
 * del schema.
 */
export const TICKET_STATUSES = ['confirmed', 'pending', 'cancelled'];

/** Valida `quantity`: tiene que ser un entero mayor a 0. */
export const validateQuantity = (quantity) => {
  const numericQuantity = Number(quantity);
  if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
    return { valid: false, message: 'quantity debe ser un número entero mayor a 0' };
  }
  return { valid: true };
};

export default {
  validateRegisterFields,
  normalizeEmail,
  EVENT_STATUSES,
  validateEventFields,
  validateEventStatus,
  escapeRegex,
  TICKET_STATUSES,
  validateQuantity,
  MIN_PASSWORD_LENGTH,
};
