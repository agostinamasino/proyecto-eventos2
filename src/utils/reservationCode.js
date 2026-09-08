import crypto from 'crypto';

/**
 * Genera un código de reserva legible y (para los fines de este proyecto)
 * suficientemente único: TCK-<timestamp en base36>-<4 bytes random en hex>.
 * El índice único de `reservationCode` en el modelo Ticket es la garantía
 * real ante una colisión, aunque sea extremadamente improbable.
 */
export const generateReservationCode = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TCK-${timestampPart}-${randomPart}`;
};

export default generateReservationCode;
