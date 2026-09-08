/**
 * Error con status HTTP asociado. Las capas de servicio la lanzan para
 * comunicar errores "esperables" (validación, duplicados, etc.) sin
 * acoplarse a Express; el controller (o el errorHandler) decide cómo
 * responder según error.status.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export default ApiError;
