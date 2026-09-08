import eventsRepository from '../repositories/events.repository.js';

export const getAllEvents = async () => {
  return eventsRepository.findAll();
};

export default { getAllEvents };
