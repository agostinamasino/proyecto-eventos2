/**
 * DTO de `Event`: controla exactamente qué campos de un documento
 * de evento salen en una respuesta HTTP, sin importar qué tenga el
 * documento de Mongoose por dentro. Ningún controller ni service arma la
 * forma de la respuesta a mano — todos pasan por acá.
 */

/** Evento completo, para las respuestas de los endpoints de /api/events. */
export const toPublicEvent = (eventDoc) => ({
  id: eventDoc._id,
  title: eventDoc.title,
  description: eventDoc.description,
  category: eventDoc.category,
  date: eventDoc.date,
  location: eventDoc.location,
  capacity: eventDoc.capacity,
  price: eventDoc.price,
  status: eventDoc.status,
  organizer: eventDoc.organizer,
  createdAt: eventDoc.createdAt,
  updatedAt: eventDoc.updatedAt,
});

/**
 * Versión resumida del evento, para cuando aparece POBLADO dentro de otra
 * respuesta (por ejemplo, el `event` de cada ticket en "mis tickets"). Un
 * ticket no necesita —ni debería exponer— el evento completo (`capacity`,
 * `price`, `organizer`, etc.), así que este DTO recorta a lo mínimo que
 * tiene sentido mostrar ahí: título, fecha y ubicación.
 */
export const toEventSummary = (eventDoc) => ({
  id: eventDoc._id,
  title: eventDoc.title,
  date: eventDoc.date,
  location: eventDoc.location,
});

export default { toPublicEvent, toEventSummary };
