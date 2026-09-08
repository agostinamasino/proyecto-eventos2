# Proyecto Eventos — Plataforma de Eventos e Inscripciones

Backend II (Coderhouse) — API REST con Express organizada por capas, para una **Plataforma de Eventos e Inscripciones**.

- **Pre-entrega 1:** base arquitectónica (estructura de carpetas, servidor Express, endpoints iniciales de `events` y `sessions`).
- **Pre-entrega 2:** registro seguro de usuarios (`POST /api/sessions/register`) con validaciones, normalización de email, hash de contraseña con bcrypt y persistencia en MongoDB.
- **Pre-entrega 3:** login con JWT, cookie de autenticación HttpOnly, ruta protegida `GET /api/sessions/current` y logout.
- **Pre-entrega 4:** refactor de la autenticación para que pase por estrategias de **Passport.js** (`register`, `login`, `current`), centralizadas en `src/config/passport.config.js`. El contrato externo de la API (rutas, requests, responses) no cambia respecto de la pre-entrega 3 — solo mejora la organización interna.
- **Pre-entrega 5 (actual):** sistema de autorización por roles. Middleware `authorize` reutilizable que protege rutas según el rol de `req.user` (403 si no coincide), matriz de permisos para `user`/`organizer`/`admin`, alta/modificación/cancelación de eventos con validación de propiedad (`organizer` solo sobre los suyos, `admin` sobre cualquiera) y una ruta administrativa (`GET /api/users`) solo para `admin`.

## Temática elegida

Plataforma de gestión de **eventos** (charlas, meetups, conferencias) donde los usuarios podrán registrarse, iniciar sesión, inscribirse a eventos y a sus sesiones/charlas. Hasta esta etapa está implementado el flujo completo de autenticación (registro, login, sesión vía cookie + JWT y logout) organizado con Passport y preparado para sumar proveedores externos (Google, GitHub, etc.) más adelante, junto con un sistema de autorización por roles que protege la creación/modificación/cancelación de eventos y una ruta administrativa de usuarios. Gestión completa de eventos y sus sesiones/charlas, inscripciones y control de cupos quedan para las próximas entregas.

## Tecnologías

- Node.js
- Express
- Mongoose (ODM para MongoDB)
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT)
- Passport, passport-local, passport-jwt (estrategias de autenticación)
- cookie-parser (lectura de cookies en Express)
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
   | `JWT_SECRET` | Secreto para firmar y verificar los JWT. Nunca hardcodeado en el código | `un_secreto_largo_y_aleatorio` |
   | `JWT_EXPIRES_IN` | Expiración del JWT / duración de la sesión (formato de la librería `jsonwebtoken`) | `1h` |

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
│   │   ├── db.js                    # Conexión a MongoDB (Mongoose)
│   │   └── passport.config.js       # Estrategias de Passport: 'register', 'login' y 'current' (JWT)
│   ├── routes/
│   │   ├── index.router.js          # Router principal, agrupa el resto de rutas bajo /api
│   │   ├── health.router.js         # GET /api/health
│   │   ├── events.router.js         # GET (pública), POST/PATCH/DELETE (auth + authorize)
│   │   ├── sessions.router.js       # register, login, current (protegida con `auth`), logout
│   │   └── users.router.js          # GET /api/users, protegida con `auth` + `authorize(['admin'])`
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js     # getEvents, createEvent, updateEvent, cancelEvent
│   │   ├── sessions.controller.js   # dispara las estrategias de Passport y traduce el resultado a respuesta HTTP + cookie
│   │   └── users.controller.js      # listUsers (ruta administrativa)
│   ├── services/
│   │   ├── events.service.js        # reglas de negocio de eventos + validación de propiedad (organizer/admin)
│   │   ├── users.service.js         # getAllUsers, para la ruta administrativa
│   │   └── sessions.service.js      # deprecado desde la pre-entrega 4 (ver más abajo); se deja vacío para conservar la estructura
│   ├── repositories/
│   │   ├── events.repository.js
│   │   ├── sessions.repository.js   # placeholder, sin lógica propia por ahora
│   │   └── users.repository.js      # findByEmail / create / findAll
│   ├── dao/
│   │   ├── events.dao.js            # única capa que consulta el modelo Event con Mongoose
│   │   ├── sessions.dao.js          # placeholder, sin lógica propia por ahora
│   │   └── users.dao.js             # única capa que consulta el modelo User con Mongoose
│   ├── models/
│   │   ├── User.js                  # first_name, last_name, email, password, role (enum: user/organizer/admin, default user)
│   │   └── Event.js                 # title, description, date, location, capacity, organizer (ref User)
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   ├── notFoundHandler.js
│   │   ├── auth.middleware.js       # AUTENTICACIÓN: ejecuta la estrategia 'current' de Passport (JWT desde la cookie), arma req.user o corta con 401
│   │   └── authorize.middleware.js  # AUTORIZACIÓN: recibe los roles permitidos, compara con req.user.role, corta con 403 si no coincide
│   └── utils/
│       ├── logger.js
│       ├── hash.js                  # hashPassword / comparePassword con bcrypt (usado por la estrategia 'register')
│       ├── jwt.js                   # signToken / verifyToken con jsonwebtoken (usado por el controller de login y por la estrategia 'current')
│       ├── validators.js            # validación de campos de registro y de eventos + normalización de email
│       └── apiError.js              # Error con status HTTP para cortar temprano desde las capas inferiores
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La API sigue una arquitectura por capas: **rutas → controladores → servicios → repositorios → DAO → modelos**. Cada capa solo se comunica con la inmediatamente inferior. `app.js` y las rutas no tienen lógica de negocio.

Desde la pre-entrega 4, la autenticación pasa por **Passport.js**: toda la lógica de validación, hash de contraseña, unicidad de email y verificación de credenciales vive dentro de las estrategias definidas en `config/passport.config.js`, no en `services/sessions.service.js` (que queda vacío/deprecado, conservado solo para no romper la estructura de carpetas). Los controllers de `sessions.controller.js` disparan esas estrategias con `passport.authenticate(...)` y se limitan a traducir el resultado a una respuesta HTTP — y, en el caso de `login`, a generar el JWT y setear la cookie una vez que Passport confirmó que las credenciales son válidas. Ver la sección **"Autenticación con Passport.js"** más abajo para el detalle de cada estrategia.

Desde la pre-entrega 5, además de autenticar (saber *quién* es el usuario) la API autoriza (decidir *qué* puede hacer ese usuario) con dos middlewares separados y reutilizables: `auth` (autenticación) y `authorize` (autorización por rol). La validación de que un `organizer` solo pueda tocar sus propios eventos no es un tercer middleware genérico, porque necesita ir a buscar el recurso a la base de datos para saber quién es su dueño: esa lógica vive en `services/events.service.js`. Ver la sección **"Roles y autorización"** más abajo para el detalle completo.

## Rutas disponibles

| Método | Ruta                         | Descripción                                          | Protegida |
|--------|------------------------------|--------------------------------------------------------|-----------|
| GET    | `/api/health`                | Verifica que el servidor está activo                    | No |
| GET    | `/api/events`                | Lista los eventos publicados                             | No |
| POST   | `/api/events`                | Crea un evento (queda asociado al usuario que lo crea)   | **Sí** — `auth` + `authorize(['organizer','admin'])` |
| PATCH  | `/api/events/:id`            | Modifica un evento                                       | **Sí** — `auth` + `authorize(['organizer','admin'])` + dueño del evento (o admin) |
| DELETE | `/api/events/:id`            | Cancela (elimina) un evento                              | **Sí** — `auth` + `authorize(['organizer','admin'])` + dueño del evento (o admin) |
| POST   | `/api/sessions/register`     | Registro seguro de usuarios                             | No |
| POST   | `/api/sessions/login`        | Login: valida credenciales y setea la cookie de sesión  | No |
| GET    | `/api/sessions/current`      | Devuelve `{ id, email, role }` del usuario autenticado  | **Sí** — `auth` |
| POST   | `/api/sessions/logout`       | Cierra la sesión (borra la cookie)                       | No |
| GET    | `/api/users`                 | Lista todos los usuarios (ruta administrativa)           | **Sí** — `auth` + `authorize(['admin'])` |

## Autenticación con Passport.js

Desde la pre-entrega 4, toda la autenticación se maneja con **Passport.js**, con las tres estrategias registradas en un único archivo: `src/config/passport.config.js`. `app.js` solo hace `app.use(passport.initialize())` — no conoce el detalle de ninguna estrategia, y las rutas (`sessions.router.js`) no cambiaron respecto de la pre-entrega 3.

| Estrategia | Tipo | Dónde se usa | Qué hace |
|---|---|---|---|
| `register` | `passport-local` (sobre `email`/`password`) | `POST /api/sessions/register` | Valida los campos, normaliza el email, chequea que no exista otro usuario con ese email, hashea el password con bcrypt y crea el usuario. |
| `login` | `passport-local` (sobre `email`/`password`) | `POST /api/sessions/login` | Busca el usuario por email y compara el password con bcrypt (`comparePassword`). No genera JWT ni toca cookies. |
| `current` | `passport-jwt` | `GET /api/sessions/current` (a través del middleware `auth`) | Extrae el JWT de la cookie `currentUser` (extractor propio, en vez del header `Authorization`) y lo verifica. |

Puntos importantes de cómo está armado:

- Las tres estrategias se registran con `passport.use(...)` dentro de `passport.config.js`; importar ese archivo (lo hace `app.js`) alcanza para que Passport las tenga disponibles en toda la app.
- El JWT y la cookie **no** se generan dentro de la estrategia `login`: la estrategia solo confirma que las credenciales son correctas y le pasa el usuario a `done(null, user)`. Es el controller `login` en `sessions.controller.js` el que, ya con la autenticación resuelta, llama a `signToken(...)` y hace `res.cookie('currentUser', token, {...})`.
- `logout` no pasa por Passport (no hay nada que "autenticar" para cerrar sesión): simplemente borra la cookie con `res.clearCookie(...)`.
- El sistema queda preparado para agregar proveedores externos (por ejemplo `passport-google-oauth20` o `passport-github2`) sin tocar `app.js` ni las rutas existentes: alcanzaría con registrar una nueva estrategia más (`passport.use('google', new GoogleStrategy(...))`) en este mismo archivo `passport.config.js`, y agregar sus rutas correspondientes — el resto de la arquitectura (controllers finos que llaman a `passport.authenticate`, `app.js` desentendido del detalle) no necesita cambios.

## Roles y autorización

El sistema define tres roles, en el campo `role` del modelo `User` (`enum: ['user', 'organizer', 'admin']`, `default: 'user'`). El registro público (`POST /api/sessions/register`) **no permite elegir el rol**: la estrategia `register` de Passport arma el usuario a crear sin leer `role` del body, así que todo usuario nuevo entra siempre como `user`, sin importar qué se mande en el request. Asignar `organizer` o `admin` es una operación que, en esta etapa, solo se hace manualmente (por ejemplo, editando el documento en MongoDB Atlas) — no hay una ruta pública para "ascender" un usuario.

### Matriz de permisos

| Acción                              | `user` | `organizer` | `admin` |
|--------------------------------------|:------:|:-----------:|:-------:|
| Consultar eventos publicados (`GET /api/events`) | ✅ | ✅ | ✅ |
| Crear eventos (`POST /api/events`)   | ❌ | ✅ | ✅ |
| Modificar/cancelar eventos **propios** (`PATCH`/`DELETE /api/events/:id`) | ❌ | ✅ | ✅ |
| Modificar/cancelar **cualquier** evento | ❌ | ❌ | ✅ |
| Ver todos los usuarios (`GET /api/users`) | ❌ | ❌ | ✅ |

### Los dos middlewares (y por qué están separados)

- **`middlewares/auth.middleware.js` — autenticación.** Responde la pregunta *"¿quién sos?"*. Lee el JWT de la cookie `currentUser`, lo valida con la estrategia `current` de Passport y arma `req.user = { id, email, role }`. Si no hay cookie, o el token es inválido/expiró, corta la cadena con **401** antes de llegar a cualquier lógica de negocio. No sabe nada de roles ni de rutas específicas: es el mismo middleware para todas las rutas privadas.

- **`middlewares/authorize.middleware.js` — autorización.** Responde la pregunta *"¿te dejo hacer esto?"*. Se usa siempre después de `auth` (necesita que `req.user` ya exista). Es una función que recibe la lista de roles permitidos y devuelve el middleware real: `authorize(['organizer', 'admin'])`. Si `req.user.role` no está en esa lista, corta con **403**. Es genérico y reutilizable: no conoce el recurso sobre el que se está actuando, solo compara roles.

- **Validación de propiedad (ownership) — en el service, no en un middleware.** Que un `organizer` solo pueda modificar/cancelar *sus propios* eventos no se puede resolver solo mirando el rol: hay que ir a buscar el evento a la base y comparar su campo `organizer` contra `req.user.id`. Por eso esa regla vive en `services/events.service.js` (función `assertCanManageEvent`), después de que `auth` y `authorize` ya dejaron pasar la petición. Si el evento no existe, responde 404; si existe pero no le pertenece (y el usuario no es `admin`), responde 403.

### 401 vs. 403 — la diferencia

- **401 (No autenticado):** no sabemos quién sos. Falta la cookie, el JWT es inválido, expiró, o fue manipulado. Nunca llegamos a evaluar permisos porque ni siquiera hay una identidad confirmada.
- **403 (Sin permisos):** sabemos perfectamente quién sos — la cookie y el JWT son válidos — pero tu rol (o no ser el dueño del recurso) no te habilita para esta acción en particular.

Ninguno de los dos casos devuelve nunca **500**: el `errorHandler` central solo cae en 500 ante errores realmente inesperados (por ejemplo, una falla real de la base de datos), no para "no autenticado" ni "sin permisos", que siempre son 401/403 explícitos.

### `GET /api/health`

```json
{ "status": "ok", "message": "Servidor activo" }
```

### `GET /api/events`

```json
{ "status": "success", "payload": [] }
```

## Eventos — creación, modificación y cancelación

### `POST /api/events` — crear evento

Requiere estar autenticado y tener rol `organizer` o `admin`. El evento queda asociado (`organizer`) al usuario que lo crea.

Body esperado:

| Campo         | Tipo   | Obligatorio | Notas |
|---------------|--------|-------------|-------|
| `title`       | string | Sí          | No puede estar vacío |
| `date`        | string (fecha) | Sí  | Formato de fecha válido (ISO 8601 recomendado, ej. `"2026-11-10"`) |
| `description` | string | No          | |
| `location`    | string | No          | |
| `capacity`    | number | No          | |

Ejemplo de request:

```json
POST /api/events
Content-Type: application/json
Cookie: currentUser=<jwt de un organizer o admin>

{ "title": "Congreso Tech 2026", "date": "2026-11-10", "location": "CABA", "capacity": 200 }
```

Respuestas:

**201 — creado:**

```json
{ "status": "success", "payload": { "id": "6690...", "title": "Congreso Tech 2026", "organizer": "665f2a...", "date": "2026-11-10T00:00:00.000Z", "location": "CABA", "capacity": 200 } }
```

**400 — faltan campos obligatorios o fecha inválida:**

```json
{ "status": "error", "message": "Faltan campos obligatorios: title y date son requeridos" }
```

**401 — sin sesión:**

```json
{ "status": "error", "message": "No autenticado" }
```

**403 — autenticado pero con rol `user`:**

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### `PATCH /api/events/:id` — modificar evento

Mismo body que la creación, pero todos los campos son opcionales (solo se actualiza lo que se manda). Requiere `organizer` o `admin`; si es `organizer`, además tiene que ser el dueño del evento.

Respuestas propias de esta ruta (además de 401/403 ya vistos):

**200 — modificado:**

```json
{ "status": "success", "payload": { "id": "6690...", "title": "Congreso Tech 2026 (actualizado)", "organizer": "665f2a...", "..." : "..." } }
```

**403 — es `organizer`, pero el evento no le pertenece:**

```json
{ "status": "error", "message": "Solo podés modificar o cancelar tus propios eventos" }
```

**404 — el evento no existe:**

```json
{ "status": "error", "message": "Evento no encontrado" }
```

### `DELETE /api/events/:id` — cancelar evento

Mismas reglas de permisos y propiedad que `PATCH`.

**200 — cancelado:**

```json
{ "status": "success", "message": "Evento cancelado" }
```

(403/404 con los mismos formatos que en `PATCH`.)

### Cómo probarlo (PowerShell)

```powershell
# Crear evento (con la cookie de un organizer o admin logueado en $session)
$eventBody = @{ title = "Congreso Tech 2026"; date = "2026-11-10"; location = "CABA"; capacity = 200 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/events" -Method Post -ContentType "application/json" -Body $eventBody -WebSession $session

# Modificar (reemplazá <id> por el id devuelto arriba)
$updateBody = @{ capacity = 250 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/events/<id>" -Method Patch -ContentType "application/json" -Body $updateBody -WebSession $session

# Cancelar
Invoke-RestMethod -Uri "http://localhost:3000/api/events/<id>" -Method Delete -WebSession $session
```

## Ruta administrativa — `GET /api/users`

Requiere estar autenticado y tener rol `admin`. Devuelve la lista de usuarios sin exponer el password.

**200 — admin:**

```json
{ "status": "success", "payload": [ { "id": "665f2a...", "first_name": "Ana", "last_name": "Pérez", "email": "ana@mail.com", "role": "user", "createdAt": "..." } ] }
```

**403 — autenticado con rol `user` u `organizer`:**

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

### Cómo probarlo (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Get -WebSession $session
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

> **Nota para Windows/PowerShell:** `curl.exe` desde PowerShell suele romper las comillas de un body JSON. Si te pasa, usá en su lugar `Invoke-RestMethod` con el body armado por `ConvertTo-Json`, como en los ejemplos de login más abajo.

## Login — `POST /api/sessions/login`

Valida el email y la contraseña contra lo guardado en la base. Si coinciden, genera un JWT (payload `{ id, email, role }`, sin `password`) firmado con `JWT_SECRET` y expiración `JWT_EXPIRES_IN`, y lo guarda en una cookie **HttpOnly** llamada `currentUser` (`sameSite: 'lax'`, `maxAge: 3600000` = 1 hora, `secure: true` solo si `NODE_ENV=production`).

Por seguridad, **cualquier problema** (email que no existe, contraseña incorrecta, o campos faltantes) devuelve siempre el mismo error genérico — nunca se distingue cuál de las dos cosas falló.

### Request de ejemplo

```json
POST /api/sessions/login
Content-Type: application/json

{ "email": "ana.test@mail.com", "password": "Secreta123" }
```

### Respuestas

**200 — login correcto** (además setea la cookie `currentUser`):

```json
{ "status": "success", "message": "Login correcto" }
```

**401 — credenciales inválidas** (email inexistente, contraseña incorrecta o campos faltantes):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

### Cómo probarlo (PowerShell)

```powershell
$body = @{ email = "ana.test@mail.com"; password = "Secreta123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/login" -Method Post -ContentType "application/json" -Body $body -SessionVariable session
```

El parámetro `-SessionVariable session` guarda la cookie que devuelve el servidor en la variable `$session`, para poder reutilizarla en el siguiente request a `/current` sin tener que copiarla a mano.

### Cómo probarlo (curl / bash)

```bash
curl -i -X POST http://localhost:3000/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana.test@mail.com","password":"Secreta123"}' \
  -c cookies.txt
```

`-c cookies.txt` guarda la cookie recibida en un archivo para reutilizarla después con `-b cookies.txt`.

## Ruta protegida — `GET /api/sessions/current`

Protegida por el middleware `auth` (`middlewares/auth.middleware.js`): lee la cookie `currentUser`, verifica el JWT con `JWT_SECRET` y arma `req.user` con el payload. Si no hay cookie, o el token es inválido/expiró, corta con 401 antes de llegar al controller.

### Respuestas

**200 — autenticado** (con la cookie de una sesión vigente):

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana.test@mail.com", "role": "user" } }
```

**401 — sin cookie o token inválido/expirado:**

```json
{ "status": "error", "message": "No autenticado" }
```

### Cómo probarlo (PowerShell, reutilizando la sesión del login)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/current" -Method Get -WebSession $session
```

Para probar el caso 401, abrí una terminal nueva (sin la variable `$session`) y corré el mismo comando sin `-WebSession`: como no manda ninguna cookie, tiene que devolver 401.

### Cómo probarlo (curl / bash)

```bash
curl -i http://localhost:3000/api/sessions/current -b cookies.txt
```

## Logout — `POST /api/sessions/logout`

Borra la cookie `currentUser` (`res.clearCookie`) y confirma. Después de un logout, un `GET /api/sessions/current` con esa misma cookie ya vencida/borrada vuelve a dar 401.

### Respuesta

**200:**

```json
{ "status": "success", "message": "Sesión cerrada" }
```

### Cómo probarlo (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/logout" -Method Post -WebSession $session
# Después de esto, /current con la misma $session debería volver a dar 401:
try { Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/current" -Method Get -WebSession $session }
catch { $_.ErrorDetails.Message }
```

## Flujo completo a probar antes de entregar

### Autenticación (pre-entregas 3 y 4)

1. **Registro → login → current → logout → current** (este último debe dar 401): la secuencia completa de arriba, en orden, con `$session` reutilizada entre pasos.
2. **Login con email inexistente** → 401 `"Credenciales inválidas"`.
3. **Login con contraseña incorrecta** (email real, password mal) → 401 `"Credenciales inválidas"`.
4. **`/current` sin cookie** (terminal nueva, sin `-WebSession`) → 401 `"No autenticado"`.
5. **`/current` con token manipulado**: copiá el valor de la cookie `currentUser`, cambiale un par de caracteres al final, y mandala a mano con un header `Cookie: currentUser=<valor_alterado>` → 401 `"No autenticado"` (la verificación de firma de `jsonwebtoken` la rechaza).

### Roles y autorización (pre-entrega 5)

Para estos casos hacen falta al menos dos usuarios logueados con roles distintos (un `user` normal, un `organizer` y, para el último caso, un `admin` — los roles `organizer`/`admin` se asignan a mano en MongoDB Atlas editando el campo `role` del documento, ya que el registro público siempre crea `user`).

1. **`POST /api/events` con rol `user`** → 403 `"No tenés permisos para realizar esta acción"`.
2. **`POST /api/events` con rol `organizer`** → 201, evento creado con `organizer` = el id de ese usuario.
3. **`GET /api/users` (ruta administrativa) con rol `organizer`** → 403.
4. **`GET /api/users` con rol `admin`** → 200, con la lista de usuarios.
5. **Cualquier ruta privada sin cookie** (por ejemplo `POST /api/events` sin `-WebSession`) → 401 `"No autenticado"`.
6. **Un `organizer` intentando modificar un evento ajeno**: creá un evento con el `organizer` A logueado, y probá `PATCH`/`DELETE /api/events/<id>` con la sesión de otro `organizer` B → 403 `"Solo podés modificar o cancelar tus propios eventos"`. Con un `admin`, esa misma operación sobre el evento ajeno tiene que dar 200.

## Próximas entregas

Sobre esta base se incorporarán: gestión completa de eventos y sus sesiones/charlas, inscripciones, control de cupos y notificaciones.
