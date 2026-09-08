import mongoose from 'mongoose';
import eventsRepository from '../repositories/events.repository.js';
import ApiError from '../utils/apiError.js';
import { validateEventFields } from '../utils/validators.js';

export const getAllEvents = async () => {
  return eventsRepository.findAll();
};

/**
 * Busca un evento por id. Separado del resto porque lo usan tanto
 * `updateEvent` como `cancelEvent` para la validación de propiedad, y
 * porque acá se traduce un id con formato inválido (o inexistente) a un
 * 404 controlado en vez de dejar que explote como error 500.
 */
const findEventOrFail = async (eventId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(404, 'Evento no encontrado');
  }

  const event = await eventsRepository.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Evento no encontrado');
  }

  return event;
};

/**
 * Válida que el usuario autenticado pueda operar sobre este evento:
 * - admin: puede modificar/cancelar cualquier evento.
 * - organizer: solo puede modificar/cancelar los eventos que él mismo creó.
 * (No se contempla el rol `user` acá porque el middleware `authorize` de
 * la ruta ya lo bloquea antes de llegar al service.)
 */
const assertCanManageEvent = (event, currentUser) => {
  if (currentUser.role === 'admin') {
    return;
  }

  if (event.organizer?.toString() !== currentUser.id?.toString()) {
    throw new ApiError(403, 'Solo podés modificar o cancelar tus propios eventos');
  }
};

export const createEvent = async ({ title, description, date, location, capacity }, currentUser) => {
  const validation = validateEventFields({ title, date });
  if (!validation.valid) {
    throw new ApiError(400, validation.message);
  }

  return eventsRepository.create({
    title: String(title).trim(),
    description: description ? String(description).trim() : undefined,
    date,
    location: location ? String(location).trim() : undefined,
    capacity,
    organizer: currentUser.id,
  });
};

export const updateEvent = async (eventId, updates, currentUser) => {
  const event = await findEventOrFail(eventId);
  assertCanManageEvent(event, currentUser);

  const { title, description, date, location, capacity } = updates;
  const validation = validateEventFields({ title, date }, { partial: true });
  if (!validation.valid) {
    throw new ApiError(400, validation.message);
  }

  const allowedUpdates = {};
  if (title !== undefined) allowedUpdates.title = String(title).trim();
  if (description !== undefined) allowedUpdates.description = String(description).trim();
  if (date !== undefined) allowedUpdates.date = date;
  if (location !== undefined) allowedUpdates.location = String(location).trim();
  if (capacity !== undefined) allowedUpdates.capacity = capacity;

  return eventsRepository.updateById(eventId, allowedUpdates);
};

export const cancelEvent = async (eventId, currentUser) => {
  const event = await findEventOrFail(eventId);
  assertCanManageEvent(event, currentUser);

  return eventsRepository.deleteById(eventId);
};

export default { getAllEvents, createEvent, updateEvent, cancelEvent };
