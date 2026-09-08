import usersRepository from '../repositories/users.repository.js';

/** Deja cada usuario listo para responder, sin exponer el password. */
const toPublicUser = (userDoc) => ({
  id: userDoc._id,
  first_name: userDoc.first_name,
  last_name: userDoc.last_name,
  email: userDoc.email,
  role: userDoc.role,
  createdAt: userDoc.createdAt,
});

export const getAllUsers = async () => {
  const users = await usersRepository.findAll();
  return users.map(toPublicUser);
};

export default { getAllUsers };
