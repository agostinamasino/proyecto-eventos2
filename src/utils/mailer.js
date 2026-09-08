import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from './logger.js';

/**
 * Transporter de Nodemailer, creado una sola vez (lazy) a partir de las
 * variables de entorno MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS. Nunca hay
 * credenciales hardcodeadas acá: si no están configuradas, `getTransporter`
 * devuelve `null` y el envío se omite (con un log), en vez de romper el
 * flujo de inscripción — la confirmación del ticket en la base de datos
 * no depende de que el email se pueda enviar.
 */
let transporter = null;

const getTransporter = () => {
  if (!config.mailHost || !config.mailUser || !config.mailPass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mailHost,
      port: Number(config.mailPort) || 587,
      secure: Number(config.mailPort) === 465,
      auth: {
        user: config.mailUser,
        pass: config.mailPass,
      },
    });
  }

  return transporter;
};

/**
 * Envía el email de confirmación de una inscripción. "Best effort": si
 * falla (o no hay credenciales configuradas), solo lo registra en el log
 * y sigue — el ticket ya quedó confirmado en la base antes de llamar a
 * esta función.
 */
export const sendTicketConfirmationEmail = async ({ to, eventTitle, eventDate, quantity, reservationCode }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    logger.info('MAIL_* no configuradas: se omite el envío del email de confirmación');
    return;
  }

  try {
    await activeTransporter.sendMail({
      from: config.mailFrom || config.mailUser,
      to,
      subject: `Confirmación de inscripción: ${eventTitle}`,
      text:
        `Tu inscripción quedó confirmada.\n\n` +
        `Evento: ${eventTitle}\n` +
        `Fecha: ${new Date(eventDate).toLocaleString('es-AR')}\n` +
        `Cantidad de entradas: ${quantity}\n` +
        `Código de reserva: ${reservationCode}\n`,
    });
    logger.info(`Email de confirmación enviado a ${to} (código ${reservationCode})`);
  } catch (error) {
    logger.error('No se pudo enviar el email de confirmación:', error.message);
  }
};

export default { sendTicketConfirmationEmail };
