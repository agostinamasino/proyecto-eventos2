import usersRepository from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { validateRegisterFields, normalizeEmail } from '../utils/validators.js';
import { signToken } from '../utils/jwt.js';
import ApiError from '../utils/apiError.js';

/**
 * Deja el documento listo para persistir sin exponer el password y sin
 * incluir el _id "crudo" de Mongoose.
 */
const toPublicUser = (userDoc) => ({
  id: userDoc._id,
  first_name: userDoc.first_name,
  last_name: userDoc.last_name,
  email: userDoc.email,
  role: userDoc.role,
});

/**
 * Registra un usuario nuevo.
 * - Valida presencia de campos, formato de email y longitud de password.
 * - Normaliza el email (trim + lowercase) antes de cualquier consulta.
 * - Rechaza el registro si el email ya existe (409).
 * - Hashea el password con bcrypt antes de guardar.
 * - Ignora cualquier `role` recibido: siempre se crea con el default del
 *   modelo ('user'), así el rol no puede manipularse desde el body público.
 */
export const registerUser = async ({ first_name, last_name, email, password }) => {
  const validation = validateRegisterFields({ first_name, last_name, email, password });
  if (!validation.valid) {
    throw new ApiError(400, validation.message);
  }

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await usersRepository.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new ApiError(409, 'El email ya está registrado');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await usersRepository.create({
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return toPublicUser(newUser);
};

/**
 * Login: busca el usuario por email y compara el password con bcrypt.
 * Ante CUALQUIER problema (email inexistente, password incorrecto, o
 * campos faltantes) responde con el mismo error genérico "Credenciales
 * inválidas" — nunca se distingue cuál de las dos cosas falló, para no
 * darle pistas a quien intenta adivinar contraseñas.
 * Si todo coincide, devuelve un JWT firmado con { id, email, role }.
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await usersRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  return signToken({ id: user._id, email: user.email, role: user.role });
};

export default { registerUser, loginUser };
