import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import usersRepository from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { validateRegisterFields, normalizeEmail } from '../utils/validators.js';
import config from './config.js';

/**
 * Passport-jwt busca el token en el header Authorization por defecto.
 * Acá lo leemos de la cookie `currentUser` en su lugar, que es donde
 * el login la deja.
 */
const cookieExtractor = (req) => req?.cookies?.currentUser || null;

/**
 * Estrategia 'register'.
 * Toda la lógica que antes vivía en sessions.service.js (validación de
 * campos, formato de email, longitud de password, normalización,
 * unicidad de email y hash con bcrypt) queda centralizada acá. El
 * `role` nunca se lee del body: usersRepository.create() recibe un
 * objeto armado a mano sin ese campo, así que el modelo siempre aplica
 * su default ('user').
 *
 * `passReqToCallback: true` porque necesitamos first_name/last_name del
 * body además de email/password (los dos únicos campos que passport-local
 * pasa por su cuenta).
 */
passport.use(
  'register',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
      try {
        const { first_name, last_name } = req.body || {};

        const validation = validateRegisterFields({ first_name, last_name, email, password });
        if (!validation.valid) {
          return done(null, false, { status: 400, message: validation.message });
        }

        const normalizedEmail = normalizeEmail(email);

        const existingUser = await usersRepository.findByEmail(normalizedEmail);
        if (existingUser) {
          return done(null, false, { status: 409, message: 'El email ya está registrado' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await usersRepository.create({
          first_name: String(first_name).trim(),
          last_name: String(last_name).trim(),
          email: normalizedEmail,
          password: hashedPassword,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Estrategia 'login'.
 * Busca el usuario por email y compara el password con bcrypt. Ante
 * CUALQUIER problema (campos faltantes, email inexistente o password
 * incorrecto) llama a done(null, false, ...) con el mismo mensaje
 * genérico "Credenciales inválidas" — nunca se distingue el motivo.
 * No genera JWT ni toca cookies: eso queda para el controller, después
 * de que esta estrategia confirme que el usuario es quien dice ser.
 */
passport.use(
  'login',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        if (!email || !password) {
          return done(null, false, { status: 401, message: 'Credenciales inválidas' });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await usersRepository.findByEmail(normalizedEmail);
        if (!user) {
          return done(null, false, { status: 401, message: 'Credenciales inválidas' });
        }

        const passwordMatches = await comparePassword(password, user.password);
        if (!passwordMatches) {
          return done(null, false, { status: 401, message: 'Credenciales inválidas' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * Estrategia 'current'.
 * Valida el JWT que viaja en la cookie `currentUser` (firmado con
 * JWT_SECRET). El payload ya tiene exactamente { id, email, role } —lo
 * que generó el controller de login—, así que no hace falta volver a
 * consultar la base: ese payload se pasa tal cual a done() y termina
 * disponible en req.user.
 */
passport.use(
  'current',
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: config.jwtSecret,
    },
    (jwtPayload, done) => {
      if (!jwtPayload) {
        return done(null, false);
      }
      return done(null, jwtPayload);
    }
  )
);

/**
 * Punto de extensión para proveedores externos (Google, GitHub, etc.):
 * cada uno se suma acá con su propio `passport.use('google', new
 * GoogleStrategy(...))`, sin tocar app.js (que solo hace
 * `passport.initialize()`) ni las rutas existentes — la ruta nueva
 * simplemente usaría `passport.authenticate('google', ...)` con el
 * nombre de esa estrategia.
 */

export default passport;
