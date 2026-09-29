import usersRepository from '../repositories/users.repository.js';

// El mapeo a DTO (excluir password, elegir qué campos salen) es
// responsabilidad del controller, no del service — ver
// controllers/users.controller.js. Este service solo devuelve los
// documentos tal como los trae el repository.
export const getAllUsers = async () => {
  return usersRepository.findAll();
};

export default { getAllUsers };
