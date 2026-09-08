# Proyecto Eventos — Plataforma de Eventos e Inscripciones

Backend II (Coderhouse) — API REST con Express organizada por capas, para una **Plataforma de Eventos e Inscripciones**.

- **Pre-entrega 1:** base arquitectónica (estructura de carpetas, servidor Express, endpoints iniciales de `events` y `sessions`).
- **Pre-entrega 2 (actual):** registro seguro de usuarios (`POST /api/sessions/register`) con validaciones, normalización de email, hash de contraseña con bcrypt y persistencia en MongoDB.

## Temática elegida

Plataforma de gestión de **eventos** (charlas, meetups, conferencias) donde los usuarios podrán registrarse, inscribirse a eventos y a sus sesiones/charlas. En esta etapa se implementó el primer flujo real: el registro seguro de usuarios. Login, JWT/cookies, Passport, roles y autorización, gestión completa de eventos, inscripciones y control de cupos quedan para las próximas entregas.

## Tecnologías

- Node.js
- Express
- Mongoose (ODM para MongoDB)
- bcrypt (hash de contraseñas)
- dotenv (variables de entorno)
- Módulos ESM (`import` / `export`)
- nodemon (recarga en desarrollo)

## Instalación

1. Cloná el repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd proyecto-eventos
   ```

2. Instalá las dependencias:

   ```bash
   npm install
   ```

## Configuración de variables de entorno

1. Copiá el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Completá los valores en `.env`:

   | Variable     | Descripción                                              | Ejemplo                                |
   |--------------|-----------------------------------------------------------|-----------------------------------------|
   | `PORT`       | Puerto en el que escucha el servidor                       | `3000`                                  |
   | `NODE_ENV`   | Entorno de ejecución                                       | `development`                           |
   | `MONGO_URL`  | Cadena de conexión a MongoDB (local o Atlas)                | `mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/eventos?retryWrites=true&w=majority` |
   | `JWT_SECRET` | Secreto para firmar tokens JWT (se usará en login, próxima entrega) | `un_secreto_seguro`         |

   > Para esta entrega, `MONGO_URL` **sí tiene que apuntar a una base de datos real y accesible**: `POST /api/sessions/register` necesita persistir el usuario. Si no hay conexión a MongoDB, el registro responde con error (503). Otros endpoints de solo lectura, como `GET /api/events`, siguen devolviendo una lista vacía si no hay DB conectada.

### Conexión con MongoDB Atlas

Este proyecto usa MongoDB Atlas (plan gratuito M0) como base de datos.

1. **Crear cuenta y cluster:** entrá a [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register), creá una cuenta y un proyecto. Con **"Build a Database"** elegí el plan **M0 (Free)**, cualquier proveedor/región, y creá el cluster (tarda unos minutos en aprovisionarse).

2. **Crear un usuario de base de datos:** en el asistente inicial (o después en *Database Access*) creá un usuario con contraseña autogenerada o propia. **Guardá la contraseña**: si tiene caracteres especiales (`@ # $ % / : ?` etc.) hay que codificarlos con [percent-encoding](https://www.mongodb.com/docs/manual/reference/connection-string/#connection-string-options) al armar la URL (por ejemplo `@` → `%40`), o directamente usar una contraseña sin símbolos para evitar el problema.

3. **Permitir el acceso de red:** en *Network Access → Add IP Address*. Para desarrollo, la opción más simple es **"Allow Access from Anywhere"** (`0.0.0.0/0`); en un entorno productivo se restringiría a IPs puntuales.

4. **Obtener la cadena de conexión:** en el cluster, botón **Connect → Drivers**, elegí Node.js y copiá la URI. Tiene esta forma:

   ```
   mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

5. **Completarla y agregar el nombre de la base:** reemplazá `<usuario>` y `<password>` por los reales, y agregá `/eventos` (el nombre de la base de datos) justo antes del `?`:

   ```
   mongodb+srv://miusuario:miPassword123@cluster0.xxxxx.mongodb.net/eventos?retryWrites=true&w=majority&appName=Cluster0
   ```

   Si no ponés el nombre de la base en el path, Mongoose va a usar por defecto una base llamada `test`.

6. **Pegar esa URL en tu `.env`** (nunca en `.env.example` ni en el código) como valor de `MONGO_URL`.

7. **Verificar la conexión:** corré `npm run dev` y fijate en la consola el mensaje `Conexión a MongoDB establecida`. Si ves un error de autenticación o timeout, revisá usuario/contraseña, el IP whitelisting del paso 3, o que el cluster ya haya terminado de aprovisionarse.

8. **Ver los datos en Atlas:** en el cluster, botón **Browse Collections**, deberías ver la base `eventos` con la colección `users` después de registrar un usuario — ahí podés confirmar que el campo `password` es un hash de bcrypt y no texto plano.

## Cómo ejecutar

- Modo desarrollo (con recarga automática):

  ```bash
  npm run dev
  ```

- Modo producción:

  ```bash
  npm start
  ```

Por defecto el servidor queda disponible en `http://localhost:3000` (o el puerto que hayas configurado en `PORT`).

## Estructura de carpetas

```
proyecto-eventos/
├── src/
│   ├── app.js                       # Configura Express (middlewares y rutas). No levanta el servidor.
│   ├── server.js                    # Levanta el servidor y conecta a la base de datos.
│   ├── config/
│   │   ├── config.js                # Lectura de variables de entorno (dotenv)
│   │   └── db.js                    # Conexión a MongoDB (Mongoose)
│   ├── routes/
│   │   ├── index.router.js          # Router principal, agrupa el resto de rutas bajo /api
│   │   ├── health.router.js         # GET /api/health
│   │   ├── events.router.js         # GET /api/events
│   │   └── sessions.router.js       # POST /api/sessions/register (login/current/logout: estructura inicial)
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js   # register() traduce el resultado del service a respuesta HTTP
│   ├── services/
│   │   ├── events.service.js
│   │   └── sessions.service.js      # registerUser(): validación, normalización, hash, alta de usuario
│   ├── repositories/
│   │   ├── events.repository.js
│   │   ├── sessions.repository.js   # placeholder para login/current/logout
│   │   └── users.repository.js      # findByEmail / create, usado por sessions.service
│   ├── dao/
│   │   ├── events.dao.js
│   │   ├── sessions.dao.js          # placeholder para login/current/logout
│   │   └── users.dao.js             # única capa que consulta el modelo User con Mongoose
│   ├── models/
│   │   ├── User.js                  # first_name, last_name, email, password, role
│   │   └── Event.js
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── notFoundHandler.js
│   └── utils/
│       ├── logger.js
│       ├── hash.js                  # hashPassword / comparePassword con bcrypt (reutilizable)
│       ├── validators.js            # validación de campos de registro + normalización de email
│       └── apiError.js              # Error con status HTTP para cortar temprano desde el service
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La API sigue una arquitectura por capas: **rutas → controladores → servicios → repositorios → DAO → modelos**. Cada capa solo se comunica con la inmediatamente inferior. `app.js` y las rutas no tienen lógica de negocio: toda la validación, normalización y hash del registro vive en `services/sessions.service.js` y en los helpers de `utils/`.

## Rutas disponibles

| Método | Ruta                         | Descripción                            | Estado en esta entrega |
|--------|------------------------------|-----------------------------------------|-------------------------|
| GET    | `/api/health`                | Verifica que el servidor está activo    | Funcional |
| GET    | `/api/events`                | Lista los eventos                        | Funcional (lista vacía hasta que haya datos) |
| POST   | `/api/sessions/register`     | Registro seguro de usuarios             | **Funcional** |
| POST   | `/api/sessions/login`        | Login de usuario                         | Estructura inicial, sin lógica |
| GET    | `/api/sessions/current`      | Usuario de la sesión actual              | Estructura inicial, sin lógica |
| POST   | `/api/sessions/logout`       | Cierre de sesión                         | Estructura inicial, sin lógica |

### `GET /api/health`

```json
{ "status": "ok", "message": "Servidor activo" }
```

### `GET /api/events`

```json
{ "status": "success", "payload": [] }
```

## Registro de usuarios — `POST /api/sessions/register`

### Campos que espera el body (JSON)

| Campo        | Tipo   | Obligatorio | Reglas                                      |
|--------------|--------|-------------|----------------------------------------------|
| `first_name` | string | Sí          | No puede venir vacío                          |
| `last_name`  | string | Sí          | No puede venir vacío                          |
| `email`      | string | Sí          | Formato de email válido; se normaliza (trim + lowercase) antes de guardar; debe ser único |
| `password`   | string | Sí          | Mínimo 8 caracteres; se hashea con bcrypt antes de guardar |

`role` **no se toma del body**: el service arma el usuario a crear sin leer ese campo, así que aunque se envíe en el request, se ignora y el usuario siempre se crea con el valor por defecto `user`. Los valores posibles del modelo son `user`, `organizer` y `admin`, pero asignar `organizer`/`admin` queda para cuando se implemente la lógica de autorización (próximas entregas).

### Request de ejemplo

```json
POST /api/sessions/register
Content-Type: application/json

{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

### Respuestas

**201 — registro exitoso** (email normalizado, sin `password`):

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

**400 — faltan campos, email inválido o password corto:**

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

**409 — el email ya está registrado:**

```json
{ "status": "error", "message": "El email ya está registrado" }
```

**503 — no hay conexión a la base de datos** (revisá `MONGO_URL`):

```json
{ "status": "error", "message": "La base de datos no está disponible en este momento" }
```

### Cómo probarlo

Con `curl`:

```bash
curl -i -X POST http://localhost:3000/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Pérez","email":"Ana@Mail.com ","password":"Secreta123"}'
```

También se puede probar con Postman/Thunder Client apuntando a `POST http://localhost:3000/api/sessions/register` con el mismo body en formato JSON.

Casos a verificar:

1. **Registro exitoso** → 201 con el usuario creado (sin `password`).
2. **Campos faltantes** (por ejemplo, sin `password`) → 400.
3. **Email con formato inválido** (por ejemplo, `"no-es-un-email"`) → 400.
4. **Email ya registrado**: repetir el mismo registro exitoso → 409.
5. **Password hasheado en la base**: en Atlas, *Browse Collections* → base `eventos` → colección `users` → abrir el documento del usuario registrado; o por consola con `mongosh "<MONGO_URL>"` y `db.users.findOne({ email: "ana@mail.com" })`. En ambos casos, confirmar que el campo `password` es un hash de bcrypt (empieza con `$2b$...`), nunca el texto plano.
6. **La respuesta nunca incluye `password`**: revisar el JSON devuelto por el punto 1 y confirmar que esa clave no está presente.

## Próximas entregas

Sobre esta base se incorporarán: login con JWT y cookies, ruta `current`, estrategias de Passport, roles y autorización, gestión completa de eventos y sus sesiones/charlas, inscripciones, control de cupos y notificaciones.
