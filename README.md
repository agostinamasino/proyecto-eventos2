# Proyecto Eventos — Plataforma de Eventos e Inscripciones

Backend II (Coderhouse) — API REST con Express organizada por capas, para una **Plataforma de Eventos e Inscripciones**.

- **Pre-entrega 1:** base arquitectónica (estructura de carpetas, servidor Express, endpoints iniciales de `events` y `sessions`).
- **Pre-entrega 2:** registro seguro de usuarios (`POST /api/sessions/register`) con validaciones, normalización de email, hash de contraseña con bcrypt y persistencia en MongoDB.
- **Pre-entrega 3:** login con JWT, cookie de autenticación HttpOnly, ruta protegida `GET /api/sessions/current` y logout.
- **Pre-entrega 4:** refactor de la autenticación para que pase por estrategias de **Passport.js** (`register`, `login`, `current`), centralizadas en `src/config/passport.config.js`. El contrato externo de la API (rutas, requests, responses) mejora la organización interna.
- **Pre-entrega 5:** sistema de autorización por roles. Middleware `authorize` reutilizable que protege rutas según el rol de `req.user` (403 si no coincide), matriz de permisos para `user`/`organizer`/`admin`, alta/modificación de eventos con validación de propiedad (`organizer` solo sobre los suyos, `admin` sobre cualquiera) y una ruta administrativa (`GET /api/users`) solo para `admin`.
- **Pre-entrega 6:** entidad `Event` completa y lógica de negocio de eventos. Modelo ampliado (`category`, `price`, `status`), CRUD completo (`POST`, `GET` listado con filtros/paginación/orden, `GET` por id, `PUT` modificar, `PATCH .../status` cambiar estado), y reglas de negocio en la capa `services` (no fecha pasada, `capacity`/`price` válidos, no modificar eventos cancelados, no publicar eventos finalizados/cancelados). Los eventos nunca se borran físicamente: "cancelar" es un cambio de estado.
- **Pre-entrega 7:** entidad `Ticket` e inscripciones a eventos. Un usuario autenticado puede inscribirse a un evento `published` (`POST /api/events/:eid/tickets`), consultar sus propias inscripciones (`GET /api/tickets/my-tickets`), cancelarlas (`PATCH /api/tickets/:tid/cancel`), y el organizer dueño del evento (o admin) puede ver quién se inscribió (`GET /api/events/:eid/tickets`). Control de cupos (los tickets `cancelled` no ocupan lugar), regla de una inscripción activa por usuario/evento, y email de confirmación con **Nodemailer** al inscribirse. Los tickets tampoco se borran físicamente: cancelar es un cambio de estado.
- **Pre-entrega 8 (actual):** refactor a una **arquitectura en capas formal**, con una capa **DTO** explícita además de DAO/Repository/Service/Controller. No cambia ninguna ruta, request ni response de las pre-entregas anteriores — es un refactor interno. Ver la sección **"Arquitectura en capas"** más abajo para el detalle completo de qué hace cada capa y qué cambió.

## Temática elegida

Plataforma de gestión de **eventos** (charlas, meetups, conferencias) donde los usuarios pueden registrarse, iniciar sesión, e inscribirse a eventos. Hasta esta etapa está implementado el flujo completo de autenticación (organizado con Passport y preparado para proveedores externos), un sistema de autorización por roles, la entidad central del dominio (eventos, con su CRUD completo, reglas de negocio y listado con filtros/paginación/orden), y ahora el flujo de inscripciones: crear un ticket, controlar cupos, cancelar, y notificar por email. Sesiones/charlas dentro de un evento y notificaciones adicionales quedan para las próximas entregas.

## Tecnologías

- Node.js
- Express
- Mongoose (ODM para MongoDB)
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT)
- Passport, passport-local, passport-jwt (estrategias de autenticación)
- cookie-parser (lectura de cookies en Express)
- Nodemailer (envío de emails de confirmación)
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
   | `MAIL_HOST` | Host del servidor SMTP para enviar emails (Nodemailer) | `smtp.ethereal.email` |
   | `MAIL_PORT` | Puerto SMTP | `587` |
   | `MAIL_USER` | Usuario de la cuenta SMTP | (el que te da Ethereal, o tu email) |
   | `MAIL_PASS` | Contraseña de la cuenta SMTP. Nunca hardcodeada en el código | (la que te da Ethereal, o una contraseña de aplicación) |
   | `MAIL_FROM` | Dirección que figura como remitente del email | (normalmente igual a `MAIL_USER`) |

   > Para esta entrega, `MONGO_URL` **sí tiene que apuntar a una base de datos real y accesible**: `POST /api/sessions/register` necesita persistir el usuario. Si no hay conexión a MongoDB, el registro responde con error (503). Otros endpoints de solo lectura, como `GET /api/events`, siguen devolviendo una lista vacía si no hay DB conectada.
   >
   > Las variables `MAIL_*` son opcionales para poder levantar el servidor: si no están completas, `utils/mailer.js` simplemente omite el envío del email (con un log) en vez de romper la inscripción. Pero para el flujo completo de esta entrega (inscripción → email de confirmación) sí hace falta configurarlas — ver la sección siguiente.

### Configurar el envío de emails (Nodemailer + Ethereal)

Para probar el email de confirmación sin necesidad de una cuenta de email real, se puede usar [Ethereal](https://ethereal.email/) — un servicio gratuito pensado exactamente para esto: te da una cuenta SMTP falsa que "recibe" los emails (nunca los entrega a una bandeja real) y te deja verlos con un link de preview.

1. Entrá a [ethereal.email/create](https://ethereal.email/create) y hacé clic en **"Create Ethereal Account"** (no hace falta registrarse con un email real, el sitio genera una cuenta de prueba al toque).
2. Te va a mostrar un **usuario** y una **contraseña** SMTP (algo como `xxxx@ethereal.email` / una contraseña random). Guardalos.
3. En tu `.env`, completá:
   ```
   MAIL_HOST=smtp.ethereal.email
   MAIL_PORT=587
   MAIL_USER=el_usuario_que_te_dio_ethereal
   MAIL_PASS=la_contraseña_que_te_dio_ethereal
   MAIL_FROM=el_mismo_usuario_que_te_dio_ethereal
   ```
4. Reiniciá el servidor. Al confirmar una inscripción (`POST /api/events/:eid/tickets`), la consola va a loguear `Email de confirmación enviado a ...`.
5. Para **ver** el email: entrá de nuevo a [ethereal.email](https://ethereal.email/) → **Login** con ese mismo usuario/contraseña → **Messages**. Ahí vas a ver el email recibido, con el asunto, el cuerpo y los datos de la inscripción.

Si preferís usar una cuenta real (por ejemplo Gmail), hace falta una **contraseña de aplicación** (no la contraseña normal de la cuenta): se genera desde la configuración de seguridad de la cuenta de Google, con la verificación en dos pasos activada.

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
│   │   ├── events.router.js         # GET, GET/:id (públicas); POST, PUT/:id, PATCH/:id/status, POST/:eid/tickets, GET/:eid/tickets
│   │   ├── sessions.router.js       # register, login, current (protegida con `auth`), logout
│   │   ├── users.router.js          # GET /api/users, protegida con `auth` + `authorize('VIEW_USERS')`
│   │   └── tickets.router.js        # GET /my-tickets, PATCH /:tid/cancel (ambas con `auth`)
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js     # listEvents, getEvent, createEvent, updateEvent, changeEventStatus — mapea a DTO con dto/event.dto.js
│   │   ├── sessions.controller.js   # dispara las estrategias de Passport y traduce el resultado a respuesta HTTP + cookie — mapea a DTO con dto/user.dto.js
│   │   ├── users.controller.js      # listUsers (ruta administrativa) — mapea a DTO con dto/user.dto.js
│   │   └── tickets.controller.js    # createTicket, getMyTickets, getEventTickets, cancelTicket — mapea a DTO con dto/ticket.dto.js
│   ├── services/
│   │   ├── events.service.js        # reglas de negocio de eventos (fechas, estados, capacity/price), filtros/paginación y validación de propiedad (organizer/admin)
│   │   ├── tickets.service.js       # reglas de negocio de inscripciones: cupos, duplicados, cancelación, y dispara el email de confirmación
│   │   ├── users.service.js         # getAllUsers, para la ruta administrativa
│   │   └── sessions.service.js      # deprecado desde la pre-entrega 4 (ver más abajo); se deja vacío para conservar la estructura
│   ├── repositories/
│   │   ├── events.repository.js     # searchEvents, countEvents, findEventById, createEvent, updateEvent, touchForCapacityLock
│   │   ├── tickets.repository.js    # createTicket, findTicketById, findActiveTicketByUserAndEvent, getOccupiedCapacity, findTicketsByUser, findTicketsByEvent, cancelTicket
│   │   ├── sessions.repository.js   # placeholder, sin lógica propia por ahora
│   │   └── users.repository.js      # findByEmail, createUser, findAllUsers
│   ├── dao/
│   │   ├── events.dao.js            # única capa que importa el modelo Event de Mongoose (findAll con filtro/skip/limit/sort, count, findById, create, updateById, touchForCapacityLock — sin deleteById a propósito)
│   │   ├── tickets.dao.js           # única capa que importa el modelo Ticket de Mongoose (create, findById, findActiveByUserAndEvent, sumActiveQuantityByEvent, findByUser, findByEvent, updateById — sin deleteById)
│   │   ├── sessions.dao.js          # placeholder, sin lógica propia por ahora
│   │   └── users.dao.js             # única capa que importa el modelo User de Mongoose
│   ├── dto/
│   │   ├── event.dto.js             # toPublicEvent (respuesta completa de un evento), toEventSummary (resumen embebido en un ticket)
│   │   ├── ticket.dto.js            # toPublicTicket (respuesta completa de un ticket), toMyTicket (ticket + evento resumido, para "mis tickets")
│   │   └── user.dto.js              # toPublicUser (registro), toCurrentUser (/current), toAdminUserSummary (listado administrativo) — ninguno expone `password`
│   ├── models/
│   │   ├── User.js                  # first_name, last_name, email, password, role (enum: user/organizer/admin, default user)
│   │   ├── Event.js                 # title, description, category, date, location, capacity, price, status (enum), organizer (ref User)
│   │   └── Ticket.js                # user (ref User), event (ref Event), status (enum), quantity, reservationCode, cancelledAt
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   ├── notFoundHandler.js
│   │   ├── auth.middleware.js       # AUTENTICACIÓN: ejecuta la estrategia 'current' de Passport (JWT desde la cookie), arma req.user o corta con 401
│   │   └── authorize.middleware.js  # AUTORIZACIÓN: recibe el nombre de una acción, busca sus roles permitidos en utils/permissions.js y compara con req.user.role, corta con 403 si no coincide
│   └── utils/
│       ├── logger.js
│       ├── hash.js                  # hashPassword / comparePassword con bcrypt (usado por la estrategia 'register')
│       ├── jwt.js                   # signToken / verifyToken con jsonwebtoken (usado por el controller de login y por la estrategia 'current')
│       ├── validators.js            # validación de campos de registro, eventos y tickets (EVENT_STATUSES, TICKET_STATUSES, reglas de fecha/capacity/price/quantity), normalización de email y escapeRegex
│       ├── reservationCode.js       # genera el código único de cada ticket
│       ├── mailer.js                # Nodemailer: arma el transporter desde config (MAIL_*) y envía el email de confirmación
│       ├── permissions.js           # Matriz de permisos centralizada: { ACCION: [roles permitidos] }, consumida por authorize.middleware.js
│       └── apiError.js              # Error con status HTTP para cortar temprano desde las capas inferiores
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La API sigue una arquitectura por capas: **rutas → controladores → servicios → repositorios → DAO → modelos**, con una capa **DTO** transversal que los controllers usan para dar forma a la respuesta final. Cada capa solo se comunica con la inmediatamente inferior. `app.js` y las rutas no tienen lógica de negocio. Ver la sección **"Arquitectura en capas"**, justo después de esta, para el detalle de qué hace cada capa, qué puede importar y qué no, y por qué existe un DTO separado del modelo.

Desde la pre-entrega 4, la autenticación pasa por **Passport.js**: toda la lógica de validación, hash de contraseña, unicidad de email y verificación de credenciales vive dentro de las estrategias definidas en `config/passport.config.js`, no en `services/sessions.service.js` (que queda vacío/deprecado, conservado solo para no romper la estructura de carpetas). Los controllers de `sessions.controller.js` disparan esas estrategias con `passport.authenticate(...)` y se limitan a traducir el resultado a una respuesta HTTP — y, en el caso de `login`, a generar el JWT y setear la cookie una vez que Passport confirmó que las credenciales son válidas. Ver la sección **"Autenticación con Passport.js"** más abajo para el detalle de cada estrategia.

Desde la pre-entrega 5, además de autenticar (saber *quién* es el usuario) la API autoriza (decidir *qué* puede hacer ese usuario) con dos middlewares separados y reutilizables: `auth` (autenticación) y `authorize` (autorización por rol). La validación de que un `organizer` solo pueda tocar sus propios eventos no es un tercer middleware genérico, porque necesita ir a buscar el recurso a la base de datos para saber quién es su dueño: esa lógica vive en `services/events.service.js`. Ver la sección **"Roles y autorización"** más abajo para el detalle completo.

Desde la pre-entrega 6, `Event` es la entidad central del dominio: el modelo se amplió (`category`, `price`, `status`) y todas las reglas de negocio (fechas, estados válidos, `capacity`/`price`, propiedad del recurso) viven en `services/events.service.js` — nunca en las rutas ni en los controllers, que solo traducen entre HTTP y las llamadas al service. Los eventos **nunca se borran físicamente**: `dao/events.dao.js` ni siquiera expone un `deleteById`; "cancelar" es cambiar `status` a `cancelled` a través de `PATCH /api/events/:id/status`. Ver la sección **"Eventos"** más abajo para el detalle completo del modelo, las reglas de negocio y los filtros de listado.

Desde la pre-entrega 7, `Ticket` relaciona usuarios con eventos (inscripciones), siguiendo la misma filosofía: solo referencias (`user`, `event` son ObjectId, nunca el objeto embebido), reglas de negocio en `services/tickets.service.js` (cupos, duplicados, estados válidos), y sin borrado físico — cancelar es `status: 'cancelled'` + `cancelledAt`. El email de confirmación (Nodemailer) se dispara desde el service después de crear el ticket, como una notificación "best effort": si falla el envío, no revierte la inscripción, que ya quedó confirmada en la base. Ver la sección **"Tickets e inscripciones"** más abajo para el detalle completo.

Desde la pre-entrega 8, la arquitectura por capas se formaliza: el Repository dejó de exponer métodos CRUD genéricos con nombres calcados del DAO (`findAll`, `create`, `updateById`) y ahora expone métodos orientados al dominio (`searchEvents`, `createTicket`, `cancelTicket`, etc.), y se agregó una capa **DTO** explícita que es la única responsable de decidir qué campos salen en cada respuesta — en particular, que `password` nunca salga, ni siquiera hasheado. Es un refactor puramente interno: ninguna ruta, request ni response cambió respecto de la pre-entrega 7. Ver la sección **"Arquitectura en capas"** para el detalle completo.

## Arquitectura en capas

Esta sección describe, capa por capa, quién puede importar a quién y de qué es responsable cada una. La regla general es que **cada capa solo conoce a la inmediatamente inferior**: un controller no sabe que Mongoose existe, un service no sabe que MongoDB existe, y ninguna de las dos importa un modelo directamente.

```
routers → controllers → services → repositories → dao → models
                ↓
               dto  (los controllers dan forma a la respuesta con esto)
```

### DAO (`src/dao/`)

Es la **única** capa que importa modelos de Mongoose (`import User from '../models/User.js'`, etc.). Expone operaciones genéricas de persistencia, sin nombres de negocio: `findById`, `findOne`, `create`, `findAll`, `count`, `updateById` (y, en el caso de `tickets.dao.js`/`events.dao.js`, un par de agregaciones/updates puntuales que sí necesitan conocer el shape de Mongo, como `sumActiveQuantityByEvent` o `touchForCapacityLock`). No valida reglas de negocio ni decide qué campos exponer — solo sabe hablar con la base. Ningún archivo fuera de `dao/` importa un modelo.

### Repository (`src/repositories/`)

Usa el DAO correspondiente (nunca un modelo directamente) y traduce sus operaciones genéricas a **métodos orientados al dominio**, que es el vocabulario que el service realmente necesita:

- `users.repository.js`: `findByEmail`, `createUser`, `findAllUsers`.
- `events.repository.js`: `searchEvents`, `countEvents`, `findEventById`, `createEvent`, `updateEvent`, `touchForCapacityLock`.
- `tickets.repository.js`: `createTicket`, `findTicketById`, `findActiveTicketByUserAndEvent`, `getOccupiedCapacity`, `findTicketsByUser`, `findTicketsByEvent`, `cancelTicket`.

Ninguno expone ya un `updateById`/`create` genérico calcado del DAO: por ejemplo, cancelar un ticket no es "actualizar un campo cualquiera", es `cancelTicket(ticketId)` — el repository sabe que "cancelar" significa `{ status: 'cancelled', cancelledAt: new Date() }`, así el service no tiene que construir ese objeto a mano ni acoplarse a los nombres de campos del modelo.

> **Nota sobre nombres:** la consigna sugería `countActiveTickets` como ejemplo de método del repository de tickets. Se eligió `getOccupiedCapacity` en su lugar porque es más preciso: no cuenta *documentos* de tickets, sino que suma su campo `quantity` (un ticket puede reservar más de un lugar) — es el "cupo ocupado" de un evento, no la "cantidad de tickets". Se priorizó que el nombre describa exactamente lo que el método hace por sobre repetir literalmente el nombre de ejemplo de la consigna.

### Service (`src/services/`)

Consume **solo repositories**, nunca DAOs ni modelos directamente. Acá vive **toda** la lógica de negocio: cálculo y control de cupos, transiciones de estado válidas/inválidas de `Event` y `Ticket`, detección de duplicados (inscripción repetida, email repetido), y las reglas de permisos que dependen de un recurso puntual (por ejemplo, que un `organizer` solo pueda modificar *sus propios* eventos — eso no lo puede resolver un middleware genérico porque necesita ir a buscar el dueño del recurso). También es la capa que dispara efectos secundarios como el email de confirmación (`utils/mailer.js`). Los services lanzan `ApiError(status, message)` para cualquier error de negocio; nunca devuelven un objeto de respuesta HTTP armado ni saben nada de `req`/`res`.

### Controller (`src/controllers/`)

Solo coordina request/response: lee `req.params`/`req.body`/`req.user`, llama al service correspondiente, y traduce el resultado a una respuesta HTTP — mapeando el/los documento(s) que devuelve el service a través del DTO correspondiente antes de responder. No calcula cupos, no valida estados, no decide reglas de negocio y no importa ningún modelo de Mongoose. Los errores que el service lanza (`ApiError`) se pasan con `next(error)` al middleware de errores central; el controller no decide códigos de estado más allá de los casos felices (200/201).

### DTO (`src/dto/`)

Cada mapper toma un documento (de Mongoose o un objeto plano) y devuelve **solo** los campos que la respuesta debe exponer. Ningún DTO incluye `password`, ni siquiera hasheado:

- `dto/user.dto.js`: `toPublicUser` (respuesta de `POST /api/sessions/register`: id, first_name, last_name, email, role), `toCurrentUser` (respuesta de `GET /api/sessions/current`: id, email, role, tal como viaja en el JWT), `toAdminUserSummary` (respuesta de `GET /api/users`: agrega `createdAt` sobre `toPublicUser`).
- `dto/event.dto.js`: `toPublicEvent` (respuesta completa de un evento) y `toEventSummary` (versión resumida — solo id/title/date/location — para cuando un evento aparece *embebido* dentro de otra respuesta).
- `dto/ticket.dto.js`: `toPublicTicket` (respuesta completa de un ticket, con `event` como el ObjectId sin poblar) y `toMyTicket` (la respuesta de `GET /api/tickets/my-tickets`, donde el repository sí popula el evento: en vez de exponer el documento de Mongoose completo del evento poblado —que traería todos sus campos—, `toMyTicket` lo pasa por `toEventSummary` antes de incluirlo. Así, si algún día un evento populado trajera un campo sensible, seguiría filtrado por el DTO del evento).

Esta es la razón por la que existe una capa DTO separada del modelo: cuando una respuesta usa `populate` (como `findTicketsByUser`, que popula `event`), no alcanza con filtrar los campos del documento principal — hay que filtrar también los del documento relacionado, y por eso `toMyTicket` compone el DTO del ticket con el DTO (resumido) del evento, en vez de serializar el documento poblado tal cual.

### Manejo de errores

Los services son los únicos que deciden el código HTTP de un error de negocio, lanzando `new ApiError(status, message)` (`utils/apiError.js`) con el status que corresponda: **400** (datos inválidos: campos faltantes, fecha pasada, `quantity`/`capacity`/`price` inválidos), **404** (el recurso no existe, o el id tiene un formato inválido), **409** (conflicto de estado o de negocio: evento cancelado/finalizado, ticket ya cancelado, inscripción duplicada, email duplicado, sin cupo). Los middlewares `auth`/`authorize` cortan antes de llegar al service con **401** (no autenticado) o **403** (autenticado pero sin permiso). Todos estos errores —los que lanza un service y los que devuelven los middlewares— terminan en el mismo formato de respuesta (`{ status: 'error', message }`) a través de `next(error)` y el middleware central `middlewares/errorHandler.js`, que es el único lugar de todo el proyecto que responde con **500**: solo cuando el error que llega no tiene un `.status` propio (una falla realmente inesperada, no un caso de negocio contemplado). Ver **"401 vs. 403 — la diferencia"** más abajo para el detalle de esos dos casos puntuales.

## Rutas disponibles

| Método | Ruta                         | Descripción                                          | Protegida |
|--------|------------------------------|--------------------------------------------------------|-----------|
| GET    | `/api/health`                | Verifica que el servidor está activo                    | No |
| GET    | `/api/events`                | Lista eventos, con filtros, paginación y orden           | No |
| GET    | `/api/events/:id`            | Detalle de un evento (404 si no existe)                  | No |
| POST   | `/api/events`                | Crea un evento (queda asociado al usuario que lo crea)   | **Sí** — `auth` + `authorize('MANAGE_EVENTS')` |
| PUT    | `/api/events/:id`            | Modifica un evento                                       | **Sí** — `auth` + `authorize('MANAGE_EVENTS')` + dueño del evento (o admin) |
| PATCH  | `/api/events/:id/status`     | Cambia el estado de un evento (incluye cancelarlo)       | **Sí** — `auth` + `authorize('MANAGE_EVENTS')` + dueño del evento (o admin) |
| POST   | `/api/events/:eid/tickets`   | Inscribirse a un evento (crea un ticket)                 | **Sí** — `auth` (cualquier rol) |
| GET    | `/api/events/:eid/tickets`   | Lista los inscriptos a un evento                         | **Sí** — `auth` + `authorize('VIEW_EVENT_TICKETS')` + dueño del evento (o admin) |
| GET    | `/api/tickets/my-tickets`    | Lista las inscripciones propias del usuario autenticado  | **Sí** — `auth` |
| PATCH  | `/api/tickets/:tid/cancel`   | Cancela una inscripción                                  | **Sí** — `auth` + dueño del ticket (o admin) |
| POST   | `/api/sessions/register`     | Registro seguro de usuarios                             | No |
| POST   | `/api/sessions/login`        | Login: valida credenciales y setea la cookie de sesión  | No |
| GET    | `/api/sessions/current`      | Devuelve `{ id, email, role }` del usuario autenticado  | **Sí** — `auth` |
| POST   | `/api/sessions/logout`       | Cierra la sesión (borra la cookie)                       | No |
| GET    | `/api/users`                 | Lista todos los usuarios (ruta administrativa)           | **Sí** — `auth` + `authorize('VIEW_USERS')` |

> **Nota:** en la pre-entrega 5, "modificar/cancelar" un evento era `PATCH`/`DELETE /api/events/:id`, y `DELETE` borraba el documento. Esta entrega lo reemplaza por `PUT /api/events/:id` (modificar campos) y `PATCH /api/events/:id/status` (cambiar estado, incluida la cancelación), porque la consigna explícitamente pide no borrar eventos físicamente.
>
> **Nota:** desde las correcciones post-entrega (ver **"Correcciones aplicadas"** al final), `authorize` ya no recibe un array de roles hardcodeado por ruta (`authorize(['organizer','admin'])`): recibe el nombre de una acción (`authorize('MANAGE_EVENTS')`) y consulta los roles permitidos en `utils/permissions.js`, la matriz de permisos centralizada.

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

La tabla de abajo es la versión "para leer"; la fuente de verdad real vive en código, en **`src/utils/permissions.js`** (`PERMISSIONS`, un objeto `{ ACCION: [roles permitidos] }`). Antes cada ruta hardcodeaba su propio array de roles (`authorize(['organizer', 'admin'])` repetido en varios routers), así que la matriz de permisos terminaba repartida entre las rutas y esta tabla del README, sin un lugar único donde consultarla o cambiarla. Ahora los routers solo declaran qué **acción** están protegiendo (`authorize('MANAGE_EVENTS')`, `authorize('VIEW_USERS')`, etc.) y es `authorize` quien resuelve esa acción contra `permissions.js` — ver la sección **"Correcciones aplicadas"** al final para el detalle de este ajuste.

| Acción                              | `user` | `organizer` | `admin` |
|--------------------------------------|:------:|:-----------:|:-------:|
| Consultar eventos (`GET /api/events`, `GET /api/events/:id`) | ✅ | ✅ | ✅ |
| Crear eventos (`POST /api/events`) — acción `MANAGE_EVENTS`  | ❌ | ✅ | ✅ |
| Modificar/cambiar estado de eventos **propios** (`PUT`/`PATCH .../status`) — acción `MANAGE_EVENTS` | ❌ | ✅ | ✅ |
| Modificar/cambiar estado de **cualquier** evento | ❌ | ❌ | ✅ |
| Ver inscriptos de un evento (`GET /api/events/:eid/tickets`) — acción `VIEW_EVENT_TICKETS`, solo del evento propio | ❌ | ✅ | ✅ |
| Ver todos los usuarios (`GET /api/users`) — acción `VIEW_USERS` | ❌ | ❌ | ✅ |

### Los dos middlewares (y por qué están separados)

- **`middlewares/auth.middleware.js` — autenticación.** Responde la pregunta *"¿quién sos?"*. Lee el JWT de la cookie `currentUser`, lo valida con la estrategia `current` de Passport y arma `req.user = { id, email, role }`. Si no hay cookie, o el token es inválido/expiró, corta la cadena con **401** antes de llegar a cualquier lógica de negocio. No sabe nada de roles ni de rutas específicas: es el mismo middleware para todas las rutas privadas.

- **`middlewares/authorize.middleware.js` — autorización.** Responde la pregunta *"¿te dejo hacer esto?"*. Se usa siempre después de `auth` (necesita que `req.user` ya exista). Es una función que recibe el **nombre de una acción** y devuelve el middleware real: `authorize('MANAGE_EVENTS')`. Internamente busca los roles permitidos para esa acción en `utils/permissions.js` (`rolesFor(action)`); si `req.user.role` no está entre esos roles, corta con **403**. Sigue siendo genérico y reutilizable — no conoce el recurso sobre el que se está actuando, solo resuelve la acción contra la matriz y compara roles — pero ya no requiere que cada ruta sepa (ni repita) qué roles corresponden.

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
{ "status": "success", "payload": { "data": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }
```

## Eventos

### Modelo `Event`

| Campo         | Tipo     | Obligatorio | Reglas |
|---------------|----------|-------------|--------|
| `title`       | string   | Sí          | No puede estar vacío |
| `description` | string   | Sí          | No puede estar vacía |
| `category`    | string   | Sí          | No puede estar vacía (ej. `"workshop"`, `"conferencia"`, `"meetup"`) |
| `date`        | fecha (ISO 8601) | Sí  | No puede ser una fecha pasada (ni al crear ni al modificar) |
| `location`    | string   | Sí          | No puede estar vacía |
| `capacity`    | number   | Sí          | Debe ser mayor a 0 |
| `price`       | number   | No (default `0`) | No puede ser negativo |
| `status`      | string (enum) | —      | `draft` \| `published` \| `cancelled` \| `finished`. Nuevo evento siempre arranca en `draft`; no se puede elegir al crear |
| `organizer`   | ObjectId (ref `User`) | — | Se asigna automáticamente desde `req.user` al crear. **Nunca** se lee del body, ni al crear ni al modificar — aunque se mande, se ignora |

`organizer` es siempre una referencia al id del usuario, nunca el objeto usuario embebido (así lo pide la consigna): el response de eventos expone `organizer` como un string con el id.

### Reglas de negocio (en `services/events.service.js`)

- **Fecha no pasada:** tanto al crear como al modificar, si `date` es anterior al momento actual, se rechaza con 400.
- **`capacity` y `price` válidos:** `capacity` debe ser un número mayor a 0; `price` (si se manda) no puede ser negativo. Ambos se rechazan con 400.
- **Evento cancelado = inmutable:** si `status` de un evento es `cancelled`, ni `PUT /api/events/:id` ni `PATCH /api/events/:id/status` pueden modificarlo nunca más (409). Se decidió no permitir ninguna excepción: si hiciera falta "reabrir" un evento cancelado, la forma correcta es crear uno nuevo, para no perder el historial de que ese evento puntual se canceló (por ejemplo, de cara a inscripciones ya hechas en entregas futuras).
- **No publicar eventos finalizados:** `PATCH /api/events/:id/status` con `{ "status": "published" }` sobre un evento con `status: "finished"` se rechaza con 409 (y sobre uno `cancelled`, ya está cubierto por la regla anterior).
- **Propiedad del recurso:** `organizer` solo puede modificar/cambiar el estado de sus propios eventos; `admin` puede hacerlo sobre cualquiera (ver `assertCanManageEvent` en el service, misma lógica que se explicó en "Roles y autorización").

Ninguna de estas reglas está en las rutas ni en los controllers: viven en el service, que es lo único que las rutas y controllers conocen.

### `POST /api/events` — crear evento

Requiere estar autenticado y tener rol `organizer` o `admin`.

Ejemplo de request:

```json
POST /api/events
Content-Type: application/json
Cookie: currentUser=<jwt de un organizer o admin>

{
  "title": "Congreso Tech 2026",
  "description": "Charlas sobre backend y arquitectura",
  "category": "conferencia",
  "date": "2026-11-10",
  "location": "CABA",
  "capacity": 200,
  "price": 5000
}
```

Respuestas:

**201 — creado** (arranca siempre en `status: "draft"`):

```json
{ "status": "success", "payload": { "id": "6690...", "title": "Congreso Tech 2026", "description": "...", "category": "conferencia", "date": "2026-11-10T00:00:00.000Z", "location": "CABA", "capacity": 200, "price": 5000, "status": "draft", "organizer": "665f2a..." } }
```

**400 — faltan campos, fecha pasada, `capacity` ≤ 0 o `price` negativo:**

```json
{ "status": "error", "message": "La fecha del evento no puede ser en el pasado" }
```

**401 — sin sesión:** `{ "status": "error", "message": "No autenticado" }`

**403 — autenticado pero con rol `user`:** `{ "status": "error", "message": "No tenés permisos para realizar esta acción" }`

### `GET /api/events` — listado con filtros, paginación y orden

Pública. Query params soportados (todos opcionales):

| Param       | Qué hace | Ejemplo |
|-------------|----------|---------|
| `status`    | Filtra por estado exacto (debe ser uno de los 4 válidos) | `?status=published` |
| `category`  | Filtra por categoría (coincidencia exacta, sin importar mayúsculas/minúsculas) | `?category=workshop` |
| `location`  | Filtra por ubicación (coincidencia parcial, sin importar mayúsculas/minúsculas) | `?location=caba` |
| `dateFrom`  | Solo eventos con `date >=` esta fecha | `?dateFrom=2026-11-01` |
| `dateTo`    | Solo eventos con `date <=` esta fecha | `?dateTo=2026-11-30` |
| `page`      | Página (default `1`) | `?page=2` |
| `limit`     | Resultados por página (default `10`, máximo `50`) | `?limit=5` |
| `sort`      | Campo de orden; prefijo `-` para descendente. Campos permitidos: `date`, `price`, `capacity`, `createdAt`, `title` (default `date` ascendente) | `?sort=-price` |

Se pueden combinar todos: `GET /api/events?status=published&category=workshop&page=2&limit=5`.

**200:**

```json
{
  "status": "success",
  "payload": {
    "data": [ { "id": "6690...", "title": "...", "status": "published", "...": "..." } ],
    "page": 2,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  }
}
```

### `GET /api/events/:id` — detalle de un evento

Pública.

**200:** `{ "status": "success", "payload": { "id": "6690...", "title": "...", "...": "..." } }`

**404 — no existe (o el id tiene un formato inválido):** `{ "status": "error", "message": "Evento no encontrado" }`

### `PUT /api/events/:id` — modificar evento

Requiere `organizer` (dueño del evento) o `admin`. Todos los campos del body son opcionales: solo se actualiza lo que se manda, pero cada uno que venga se valida con las mismas reglas que en la creación (fecha no pasada, `capacity > 0`, `price >= 0`, no vacíos). `organizer` y `status` nunca se tocan desde acá (para el estado está `PATCH .../status`).

**200 — modificado:** `{ "status": "success", "payload": { "id": "6690...", "capacity": 250, "...": "..." } }`

**400 — algún campo enviado no pasa las validaciones:** mismo formato que en la creación.

**403 — es `organizer`, pero el evento no le pertenece:** `{ "status": "error", "message": "Solo podés modificar tus propios eventos" }`

**404 — el evento no existe:** `{ "status": "error", "message": "Evento no encontrado" }`

**409 — el evento está cancelado:** `{ "status": "error", "message": "No se puede modificar un evento cancelado" }`

### `PATCH /api/events/:id/status` — cambiar estado (incluye cancelar)

Requiere `organizer` (dueño) o `admin`. Body: `{ "status": "<uno de los 4 valores>" }`. Cancelar un evento es, ni más ni menos, mandar `{ "status": "cancelled" }` acá — nunca se borra el documento.

**200:** `{ "status": "success", "payload": { "id": "6690...", "status": "cancelled", "...": "..." } }`

**400 — `status` no es uno de los 4 valores válidos:** `{ "status": "error", "message": "El estado (status) debe ser uno de: draft, published, cancelled, finished" }`

**403 / 404:** mismo formato que en `PUT`.

**409 — el evento ya está cancelado, o se intenta publicar uno finalizado:** `{ "status": "error", "message": "No se puede modificar el estado de un evento cancelado" }`

### Cómo probarlo (PowerShell)

```powershell
# Crear evento (con la cookie de un organizer o admin logueado en $session)
$eventBody = @{ title = "Congreso Tech 2026"; description = "Charlas de backend"; category = "conferencia"; date = "2026-11-10"; location = "CABA"; capacity = 200; price = 5000 } | ConvertTo-Json
$created = Invoke-RestMethod -Uri "http://localhost:3000/api/events" -Method Post -ContentType "application/json" -Body $eventBody -WebSession $session
$eventId = $created.payload.id

# Modificar
$updateBody = @{ capacity = 250 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId" -Method Put -ContentType "application/json" -Body $updateBody -WebSession $session

# Publicar
$statusBody = @{ status = "published" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId/status" -Method Patch -ContentType "application/json" -Body $statusBody -WebSession $session

# Listar con filtros
Invoke-RestMethod -Uri "http://localhost:3000/api/events?status=published&category=conferencia&page=1&limit=5"

# Cancelar
$cancelBody = @{ status = "cancelled" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId/status" -Method Patch -ContentType "application/json" -Body $cancelBody -WebSession $session
```

## Tickets e inscripciones

### Modelo `Ticket`

| Campo             | Tipo                  | Notas |
|-------------------|-----------------------|-------|
| `user`            | ObjectId (ref `User`) | Quién se inscribió. Nunca se lee del body: siempre es `req.user.id` |
| `event`           | ObjectId (ref `Event`)| A qué evento. Viene del parámetro de ruta `:eid`, nunca del body |
| `status`          | string (enum)         | `confirmed` \| `pending` \| `cancelled`. Un ticket nuevo se crea directamente `confirmed` (en esta entrega no hay un flujo de pago que justifique dejarlo `pending`; ese estado queda reservado para cuando se integre uno) |
| `quantity`        | number                | Cantidad de entradas de esa inscripción. Entero > 0, default `1` si no se manda |
| `reservationCode` | string, único         | Código legible generado al crear el ticket (`TCK-<timestamp>-<random>`), para identificar la inscripción sin exponer el `_id` de Mongo |
| `createdAt`       | Date                  | Automático (`timestamps: true`) |
| `cancelledAt`     | Date \| `null`        | Se completa recién al cancelar |

Igual que `Event.organizer`, tanto `user` como `event` son **siempre referencias** (ObjectId) — nunca se guarda una copia del usuario ni del evento dentro del ticket. Para mostrar datos del evento en "mis tickets" se usa `.populate('event', 'title date location')` al leer, no se duplican esos datos al escribir.

### Reglas de negocio (en `services/tickets.service.js`)

Al inscribirse (`POST /api/events/:eid/tickets`), en este orden:

1. **El evento existe** (si no, 404).
2. **El evento está `published`** — si está `cancelled` o `finished` da un mensaje específico para cada caso; si todavía es `draft`, "el evento todavía no está publicado". Los tres casos son variantes de "no está publicado", pero se distinguen para que el mensaje de error sea más claro.
3. **La fecha del evento no pasó** (409 `"El evento ya finalizó"`, el mismo mensaje que un evento ya marcado `finished`). `status: 'finished'` es una transición **manual** (`PATCH /api/events/:id/status`): nada la dispara sola cuando llega la fecha. Sin este chequeo extra, un evento que sigue `published` porque nadie se acordó de marcarlo `finished` seguiría aceptando inscripciones nuevas después de haber ocurrido.
4. **`quantity` es un entero > 0** (default `1` si no se manda).
5. **No hay ya una inscripción activa del mismo usuario para ese evento** — la regla elegida para este proyecto es **una inscripción activa por usuario y evento**; si alguien quiere reservar varios lugares (por ejemplo, para acompañantes), lo hace con `quantity` en esa única inscripción, no creando varios tickets. Un ticket `cancelled` no cuenta como "activo": después de cancelar, ese mismo usuario puede volver a inscribirse.
6. **Hay cupo suficiente**: se sí calcula sumando el `quantity` de todos los tickets **activos** (`status` distinto de `cancelled`) de ese evento, y comparando `event.capacity - ocupado >= quantity solicitada`. Los tickets `cancelled` **nunca** cuentan como cupo ocupado — por eso cancelar libera el lugar automáticamente, sin ninguna lógica adicional aparte de excluir `cancelled` del cálculo.

#### Condición de carrera: dos inscripciones simultáneas

Los pasos 5 y 6 primero **leen** el estado actual (¿ya tiene ticket activo?, ¿cuánto cupo queda?) y recién después **escriben** el ticket nuevo. Si dos requests llegan casi al mismo tiempo, los dos pueden leer "hay cupo" (o "no tiene inscripción activa") antes de que ninguno haya escrito nada todavía, y terminar creando ambos tickets aunque solo quedara lugar para uno. Esto se blinda con tres mecanismos, explicados en detalle en **"Correcciones aplicadas"** al final:

- El chequeo de duplicado, el chequeo de cupo y la creación del ticket corren dentro de **una misma transacción de MongoDB** (`session.withTransaction` en `services/tickets.service.js`).
- Dentro de esa transacción, un "toque" al documento del **evento** (`eventsRepository.touchForCapacityLock`) fuerza que dos inscripciones concurrentes al mismo evento choquen de verdad en Mongo (en vez de poder confirmar las dos en paralelo sin verse) — necesario porque cada una inserta un ticket propio, sin nada más en común que las hiciera "chocar" solas.
- El modelo `Ticket` tiene además un **índice único parcial** sobre `user`+`event` (solo para tickets activos), como defensa extra para el caso de un mismo usuario duplicando su propia inscripción: aunque algo se colara igual, Mongo rechaza el segundo `insert` a nivel de base de datos, y el service traduce ese error a 409.

Al cancelar (`PATCH /api/tickets/:tid/cancel`):

- El ticket tiene que existir (404 si no).
- Tiene que pertenecerle a quien cancela, o quien cancela tiene que ser `admin` (403 si no).
- No se puede cancelar un ticket ya `cancelled` (409).
- Cancelar cambia `status` a `cancelled` y completa `cancelledAt` — **nunca se borra el documento** (así se conserva el historial de inscripciones/cancelaciones).

### `POST /api/events/:eid/tickets` — inscribirse

Requiere estar autenticado (cualquier rol — no hace falta ser `organizer` ni `admin` para inscribirse a un evento).

```json
POST /api/events/6690.../tickets
Content-Type: application/json
Cookie: currentUser=<jwt>

{ "quantity": 2 }
```

**201 — inscripción confirmada** (dispara el email de confirmación):

```json
{ "status": "success", "payload": { "id": "66a1...", "user": "665f2a...", "event": "6690...", "status": "confirmed", "quantity": 2, "reservationCode": "TCK-...", "createdAt": "...", "cancelledAt": null } }
```

**400 — `quantity` inválida:** `{ "status": "error", "message": "quantity debe ser un número entero mayor a 0" }`

**401 — sin sesión:** `{ "status": "error", "message": "No autenticado" }`

**404 — el evento no existe:** `{ "status": "error", "message": "Evento no encontrado" }`

**409 — evento no disponible, sin cupo, o ya inscripto:**

```json
{ "status": "error", "message": "El evento está cancelado" }
```
```json
{ "status": "error", "message": "El evento ya finalizó" }
```
```json
{ "status": "error", "message": "El evento todavía no está publicado" }
```
```json
{ "status": "error", "message": "No hay cupos suficientes: quedan 0 disponibles" }
```
```json
{ "status": "error", "message": "Ya tenés una inscripción activa para este evento" }
```

### `GET /api/tickets/my-tickets` — mis inscripciones

Requiere estar autenticado. Devuelve solo las inscripciones del usuario que hace el request, con el evento poblado (únicamente `title`, `date`, `location` — nunca datos de otros usuarios ni el resto de los campos del evento).

**200:**

```json
{
  "status": "success",
  "payload": [
    { "id": "66a1...", "status": "confirmed", "quantity": 2, "reservationCode": "TCK-...", "createdAt": "...", "cancelledAt": null,
      "event": { "id": "6690...", "title": "Workshop de Node", "date": "2026-12-01T00:00:00.000Z", "location": "CABA" } }
  ]
}
```

### `GET /api/events/:eid/tickets` — inscriptos a un evento

Requiere `organizer` (dueño de ese evento) o `admin`. Un `organizer` que no es dueño del evento consultado recibe 403 — ni siquiera se le informa cuántos inscriptos tiene.

**200:** `{ "status": "success", "payload": [ { "id": "66a1...", "user": "665f2a...", "event": "6690...", "status": "confirmed", "quantity": 2, "...": "..." } ] }`

**403 — no es el dueño del evento (y no es admin):** `{ "status": "error", "message": "Solo podés ver las inscripciones de tus propios eventos" }`

### `PATCH /api/tickets/:tid/cancel` — cancelar una inscripción

Requiere ser el dueño del ticket, o `admin`.

**200:** `{ "status": "success", "payload": { "id": "66a1...", "status": "cancelled", "cancelledAt": "...", "...": "..." } }`

**403 — el ticket no es tuyo (y no sos admin):** `{ "status": "error", "message": "Solo podés cancelar tus propias inscripciones" }`

**404 — el ticket no existe:** `{ "status": "error", "message": "Ticket no encontrado" }`

**409 — ya estaba cancelado:** `{ "status": "error", "message": "Esta inscripción ya está cancelada" }`

### Notificaciones por email (Nodemailer)

Al confirmarse una inscripción, `services/tickets.service.js` llama a `utils/mailer.js`, que arma un transporter de Nodemailer con las variables `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASS` (nunca hardcodeadas) y le manda al email del usuario (`req.user.email`, del JWT) un resumen: evento, fecha, cantidad y código de reserva. Ver **"Configurar el envío de emails"** más arriba para dejarlo funcionando con Ethereal.

Es una notificación "best effort": si `MAIL_*` no está configurado, o el envío falla por cualquier motivo, se loguea y la función simplemente retorna — la inscripción ya se guardó en la base antes de intentar el envío, así que un problema de email nunca hace fallar la inscripción en sí.

El transporter de Nodemailer se crea con `connectionTimeout`/`greetingTimeout`/`socketTimeout` explícitos (10 segundos cada uno) en vez de dejar los default de la librería (hasta 10 minutos de `socketTimeout`). Como el envío se espera (`await`) antes de responderle al cliente, sin este límite un SMTP lento o caído dejaría la inscripción entera colgada esperando el email — exactamente lo que "best effort" quiere evitar. Con el timeout, en el peor caso tarda ~10 segundos en desistir y responder igual.

### Cómo probarlo (PowerShell)

```powershell
# Inscribirse (con la cookie de un usuario logueado en $session, a un evento $eventId que esté published)
$ticketBody = @{ quantity = 1 } | ConvertTo-Json
$ticket = Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId/tickets" -Method Post -ContentType "application/json" -Body $ticketBody -WebSession $session
$ticketId = $ticket.payload.id

# Mis inscripciones
Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/my-tickets" -Method Get -WebSession $session

# Inscriptos a un evento (como el organizer dueño, o admin)
Invoke-RestMethod -Uri "http://localhost:3000/api/events/$eventId/tickets" -Method Get -WebSession $session

# Cancelar
Invoke-RestMethod -Uri "http://localhost:3000/api/tickets/$ticketId/cancel" -Method Patch -WebSession $session
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

> **Nota:** este 409 sale de dos caminos distintos, con el mismo resultado para quien llama. El camino normal es el chequeo explícito: la estrategia `register` busca el email antes de crear el usuario. El camino "de carrera" es cuando dos registros con el mismo email llegan casi juntos y ambos pasan ese chequeo antes de que ninguno haya insertado nada todavía — ahí es el índice `unique` de Mongo sobre `email` el que rechaza el segundo insert (error de clave duplicada, código `11000`), y la estrategia lo atrapa y lo traduce al mismo 409, en vez de dejarlo caer como un 500 sin manejar. Ver **"Correcciones aplicadas"** al final para el detalle.

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
6. **Un `organizer` intentando modificar un evento ajeno**: creá un evento con el `organizer` A logueado, y probá `PUT`/`PATCH .../status` con la sesión de otro `organizer` B → 403. Con un `admin`, esa misma operación sobre el evento ajeno tiene que dar 200.

### Entidad Event y lógica de negocio (pre-entrega 6)

1. **Crear evento con rol `user`** → 403.
2. **Crear evento con fecha pasada** (por ejemplo `"2020-01-01"`) → 400 `"La fecha del evento no puede ser en el pasado"`.
3. **Crear evento con `capacity: 0`** → 400 `"La capacidad (capacity) debe ser un número mayor a 0"`.
4. **`organizer` modifica (`PUT`) un evento propio** → 200.
5. **`organizer` modifica un evento ajeno** → 403.
6. **`admin` modifica un evento de otro organizador** → 200.
7. **Cambiar el estado (`PATCH .../status`) de un evento ya cancelado** → 409.
8. **Listar con filtros**: `GET /api/events?status=published&category=workshop&page=2&limit=5` → 200, con `data`/`page`/`limit`/`total`/`totalPages` coherentes (para llegar a la página 2 hacen falta más de 5 eventos `published` de categoría `workshop`; si no, `data` va a venir vacío pero `total`/`totalPages` van a reflejar la cantidad real).
9. **Consultar un evento inexistente** (`GET /api/events/<id_que_no_existe>`) → 404.

### Tickets, inscripciones y control de cupos (pre-entrega 7)

Para estos casos hace falta un evento en estado `published` con `capacity` chica (por ejemplo `2`), para poder llegar al límite de cupo sin crear decenas de usuarios de prueba.

1. **Inscripción exitosa** (`POST /api/events/:eid/tickets`) → 201, y revisando Ethereal (o la config de email que hayas usado) tiene que aparecer el email de confirmación con el `reservationCode`.
2. **Inscripción sin sesión** → 401 `"No autenticado"`.
3. **Inscripción a un evento inexistente** → 404 `"Evento no encontrado"`.
4. **Inscripción a un evento cancelado o finalizado**: cancelá un evento (`PATCH /api/events/:id/status` con `{ "status": "cancelled" }`) y probá inscribirte → 409 `"El evento está cancelado"` (o `"El evento ya finalizó"` si el estado es `finished`).
5. **Inscripción sin cupo suficiente**: con un evento de `capacity: 2`, inscribí a dos usuarios distintos (ocupando los 2 lugares) y probá con un tercero → 409 `"No hay cupos suficientes: quedan 0 disponibles"`.
6. **Inscripción duplicada activa**: con un usuario que ya tiene un ticket activo para ese evento, probá inscribirlo de nuevo → 409 `"Ya tenés una inscripción activa para este evento"`.
7. **Cancelación propia libera el cupo**: cancelá uno de los tickets del paso 5 (`PATCH /api/tickets/:tid/cancel`) y volvé a intentar la inscripción que había fallado por falta de cupo → ahora tiene que dar 201.
8. **Cancelación de un ticket ajeno como `user`** → 403 `"Solo podés cancelar tus propias inscripciones"`.
9. **`GET /api/events/:eid/tickets` como `user` común** → 403 (el middleware `authorize('VIEW_EVENT_TICKETS')` ni deja pasar el rol).
10. **`GET /api/events/:eid/tickets` como `organizer` de **otro** evento** (no el dueño de `:eid`) → 403 `"Solo podés ver las inscripciones de tus propios eventos"`.
11. **Inscripción a un evento `published` cuya fecha ya pasó, sin que nadie lo haya marcado `finished`**: como no se puede *crear* un evento con fecha pasada, para simular este caso hay que editar el campo `date` de un evento `published` ya existente directamente en MongoDB Atlas, dejándolo en el pasado (el `status` se deja como está, en `published`). Probar `POST /api/events/:eid/tickets` sobre ese evento → 409 `"El evento ya finalizó"`, el mismo mensaje que si alguien lo hubiera marcado `finished` a mano.

### Correcciones tras la devolución de la pre-entrega 7

1. **Matriz de permisos centralizada**: cualquiera de los casos de "Roles y autorización" de arriba (por ejemplo, `POST /api/events` con rol `user` → 403) tiene que seguir dando el mismo resultado que antes — lo único que cambió es que `authorize` ahora resuelve los roles permitidos consultando `utils/permissions.js` en vez de recibirlos hardcodeados en la ruta.
2. **Registro con emails en carrera**: mandar, casi al mismo tiempo (por ejemplo, dos `Invoke-RestMethod` sin esperar la respuesta del primero, o `Start-Job`), dos `POST /api/sessions/register` con el mismo email → uno de los dos tiene que dar 201 y el otro 409 `"El email ya está registrado"` — nunca un 500.
3. **Cupos con inscripciones en carrera**: con un evento `published` de `capacity: 1`, mandar dos `POST /api/events/:eid/tickets` casi simultáneos de dos usuarios distintos → solo uno de los dos tiene que dar 201; el otro, 409 `"No hay cupos suficientes: quedan 0 disponibles"` (nunca los dos con 201, que sería vender de más el cupo).

### Las 5 pruebas de la arquitectura en capas (pre-entrega 8)

Estas cinco son las que pide explícitamente esta entrega. Ninguna requiere datos nuevos: reusan las mismas rutas de siempre, porque el refactor no cambió el comportamiento externo.

1. **Flujo completo**: `POST /api/sessions/register` → `POST /api/sessions/login` → `POST /api/events` (como `organizer`) → `PATCH /api/events/:id/status` para publicarlo → `POST /api/events/:eid/tickets` (inscribirse) → `GET /api/tickets/my-tickets` → `PATCH /api/tickets/:tid/cancel`. Cada paso tiene que dar el código y el payload documentados en su sección correspondiente más arriba.
2. **`GET /api/sessions/current` sin `password`**: la respuesta (`payload`) tiene que tener exactamente `id`, `email`, `role` — nunca un campo `password`, ni siquiera hasheado. Lo garantiza `dto/user.dto.js` (`toCurrentUser`).
3. **Ticket con `populate` sin `password`**: `GET /api/tickets/my-tickets` popula el `event` de cada ticket (`ticketsDao.findByUser` usa `.populate('event', 'title date location')`), pero el punto de esta prueba es que **ningún** dato sensible se filtre a través de esa relación poblada — se verifica inspeccionando el JSON completo de la respuesta y confirmando que no aparece `password` en ningún nivel (ni en el ticket, ni en el evento embebido). Lo garantiza que `toMyTicket` (`dto/ticket.dto.js`) pase el evento poblado por `toEventSummary` en vez de serializarlo tal cual.
4. **Endpoint de error de negocio nunca da 500**: por ejemplo, inscribirse dos veces al mismo evento (`POST /api/events/:eid/tickets` repetido) tiene que dar 409, no 500; lo mismo con cualquiera de los casos 400/404/409 ya documentados en cada sección. El `errorHandler` central solo cae en 500 ante un error realmente inesperado, no ante un caso de negocio contemplado.
5. **401 vs. 403 en una ruta protegida**: pedir un endpoint protegido sin cookie (por ejemplo, `GET /api/tickets/my-tickets`) → 401; con una cookie válida pero de un rol sin permiso (por ejemplo, `POST /api/events` logueado como `user`) → 403.

## Correcciones aplicadas

Después de entregada la pre-entrega 7, la devolución de la cátedra marcó tres ajustes puntuales sobre entregas ya corregidas (pre-entrega 2, pre-entrega 5 y pre-entrega 7). Se implementaron los tres sobre `main`, sin volver a tocar los commits/tags ya entregados de esas pre-entregas (esos tags siguen representando el estado exacto que se corrigió en su momento).

**1. Matriz de permisos centralizada** (devolución de la pre-entrega 5). Antes, cada ruta privada hardcodeaba su propio array de roles permitidos (`authorize(['organizer', 'admin'])`, repetido en `events.router.js` y `users.router.js`), y ese mismo array se repetía a mano en este README. Si mañana cambiara quién puede hacer qué, había que acordarse de tocar cada ruta por separado. Ahora existe **`src/utils/permissions.js`**, con un único objeto `PERMISSIONS` que mapea cada acción (`MANAGE_EVENTS`, `VIEW_EVENT_TICKETS`, `VIEW_USERS`) a sus roles permitidos, y `middlewares/authorize.middleware.js` recibe el **nombre de la acción**, no el array: `authorize('MANAGE_EVENTS')` en vez de `authorize(['organizer', 'admin'])`. El comportamiento externo (qué rol puede hacer qué, y los 401/403 que devuelve) no cambió — lo que cambió es que ahora hay un solo lugar para leerlo o modificarlo.

**2. Registro con emails duplicados en carrera** (devolución de la pre-entrega 2). La estrategia `register` de Passport ya validaba que el email no estuviera repetido (`usersRepository.findByEmail` antes de crear), pero ese chequeo y el `create()` posterior no son atómicos entre sí: si dos registros con el mismo email llegaban casi al mismo tiempo, los dos podían pasar el chequeo "no existe" antes de que ninguno hubiera insertado nada, y el segundo `insert` terminaba chocando contra el índice `unique` de Mongo sobre `email` con un error de clave duplicada (código `11000`) que no tenía `.status` — el `errorHandler` central lo traducía a un 500 sin manejar, en vez del 409 que corresponde. Ahora el `catch` de la estrategia `register` (en `config/passport.config.js`) detecta ese código específico y responde el mismo 409 `"El email ya está registrado"` que el chequeo explícito, así la condición de carrera da exactamente el mismo resultado que el caso normal.

**3. Carrera de cupos en las inscripciones** (devolución de la pre-entrega 7). En `createTicket` (`services/tickets.service.js`), el chequeo de "¿ya tiene inscripción activa?", el chequeo de "¿hay cupo?" y la creación del ticket eran tres operaciones separadas: leer, leer, escribir. Si dos inscripciones (del mismo usuario, o de usuarios distintos peleando el último lugar) llegaban casi juntas, ambas podían leer "hay cupo" antes de que ninguna hubiera escrito el ticket, y las dos terminaban creándolo — vendiendo de más el cupo, o duplicando la inscripción de un mismo usuario. Se blindó con dos mecanismos, sumados según lo que pedía la devolución ("índice único parcial (...) y/o transacción atómica"):

   - Las tres operaciones (chequeo de duplicado, chequeo de cupo, creación del ticket) ahora corren dentro de **una misma transacción de MongoDB** (`mongoose.startSession()` + `session.withTransaction(...)`). Esto requiere que `MONGO_URL` apunte a un **replica set** — MongoDB Atlas siempre lo es, incluso en el plan gratuito M0, así que no hace falta ningún cambio de configuración para quien ya sigue la guía de este README; un Mongo local standalone, en cambio, no soporta transacciones multi-documento.
   - Como defensa adicional, independiente de que las transacciones estén disponibles o no, el modelo `Ticket` (`models/Ticket.js`) tiene un **índice único parcial** sobre `user`+`event`, con `partialFilterExpression: { status: { $ne: 'cancelled' } }`: a nivel de base de datos, no puede existir más de un ticket activo del mismo usuario para el mismo evento. Si algo se colara igual, Mongo rechaza el `insert` con un error de clave duplicada (código `11000`), que el `catch` de `createTicket` traduce al mismo 409 `"Ya tenés una inscripción activa para este evento"`.

   La carrera por el *cupo* en sí (dos usuarios **distintos** peleando el último lugar) necesitaba un paso más, que solo se descubrió probando esto con jobs concurrentes de PowerShell: una transacción sola **no alcanza** cuando las dos operaciones concurrentes escriben documentos distintos sin nada en común (cada una inserta *su propio* ticket) — Mongo no tiene por qué detectar que las dos transacciones están compitiendo, y en teoría las dos podían leer "hay 1 lugar libre" y confirmar en paralelo sin verse, vendiendo el mismo cupo dos veces. La solución fue agregar, al principio de la transacción, un "toque" al documento del **evento** (`eventsRepository.touchForCapacityLock`, un `updateOne` que no cambia ningún dato visible, solo `updatedAt`): como ahora las dos transacciones concurrentes sí escriben sobre el *mismo* documento, Mongo fuerza un choque real (`WriteConflict`) entre ellas — una se confirma, la otra se reintenta automáticamente (`withTransaction` lo hace solo) y, al reintentar, vuelve a calcular el cupo ya con el ticket de la primera contado.

   Probando esto también se encontró que el envío del email de confirmación (`utils/mailer.js`) no tenía ningún timeout explícito: como se espera (`await`) antes de responderle al cliente, un SMTP lento o caído podía dejar la inscripción entera colgada esperando esa respuesta (los timeouts por defecto de Nodemailer llegan hasta 10 minutos). Se le agregaron `connectionTimeout`/`greetingTimeout`/`socketTimeout` de 10 segundos al transporter, así "best effort" se cumple también en el peor caso: si el email no sale, desiste rápido y responde igual.

   Una tercera cosa que salió a la luz recién al forzar la carrera con dos jobs reales de PowerShell: `tickets.dao.js` le pasaba la `session` a `Ticket.create(ticketData, { session })` con `ticketData` como un objeto suelto — Mongoose solo reconoce las opciones (incluida `session`) como segundo argumento cuando el primero es un **array** de documentos; con un solo objeto, termina interpretando mal los argumentos y la creación del ticket fallaba con un error de validación ("todos los campos son requeridos"). Se corrigió envolviendo siempre `ticketData` en un array (`Ticket.create([ticketData], { session })`), que es la forma que Mongoose sí soporta.

## Refactor a arquitectura en capas (pre-entrega 8)

La estructura de capas (rutas → controllers → services → repositories → dao → modelos) ya existía desde la pre-entrega 1. Esta entrega la formaliza con dos cambios puntuales, sin tocar ninguna ruta, request ni response existente — ver la sección **"Arquitectura en capas"**, cerca del principio de este README, para la explicación completa de qué hace cada capa hoy.

**1. Capa DTO explícita.** Antes, cada controller armaba su propia respuesta a mano (por ejemplo, `sessions.controller.js` tenía su propia función `toPublicUser` inline, y `users.service.js` tenía **otra** función con el mismo nombre pero campos distintos — dos mapeos separados, fáciles de desincronizar). Ahora existe `src/dto/`, con un mapper por entidad (`event.dto.js`, `ticket.dto.js`, `user.dto.js`) que es la única fuente de verdad de qué campos salen en cada respuesta. Esto no cambió ningún payload existente — los DTO se escribieron para reproducir exactamente los campos que cada endpoint ya devolvía — pero centraliza esa decisión en un solo lugar por entidad, y deja explícito, en el mismo archivo, que `password` nunca es uno de esos campos.

**2. Repository con nombres de dominio.** Antes, el repository era básicamente un pass-through del DAO con los mismos nombres genéricos (`eventsRepository.findAll`, `.count`, `.findById`, `.create`, `.updateById`; igual en `tickets.repository.js` y `users.repository.js`), lo que borraba la diferencia entre "la capa que sabe hablar con Mongo" (DAO) y "la capa que expone operaciones de negocio" (Repository) — ambas terminaban exponiendo lo mismo. Ahora cada repository tiene su propio vocabulario (`searchEvents`, `createTicket`, `cancelTicket`, `findByEmail`, etc., ver el detalle completo en "Arquitectura en capas") y ya no exporta ningún método CRUD genérico. Esto obligó a actualizar todos los call sites (`events.service.js`, `tickets.service.js`, `users.service.js`, `config/passport.config.js`) para llamar a los nuevos nombres — un cambio mecánico, ya que la lógica de negocio en sí (qué se valida, en qué orden, qué transacción usa) no se tocó.

### Validación agregada antes de la entrega final: fecha del evento al inscribirse

La consigna de la entrega final pide validar, al inscribirse, "evento, estado, **fecha**, duplicados y cupos" como chequeos distintos. Hasta acá, `createTicket` validaba el `status` del evento (`cancelled`/`finished`/`draft` → 409) pero no su `date` de forma independiente: un evento `published` cuya fecha ya pasó seguía aceptando inscripciones nuevas, porque `finished` es una transición manual (`PATCH /api/events/:id/status`) y nada la dispara sola cuando llega la fecha. Se agregó un chequeo explícito en `services/tickets.service.js` — si `event.date` ya pasó, se responde el mismo 409 `"El evento ya finalizó"` que un evento marcado `finished` a mano, porque para quien se quiere inscribir el resultado es idéntico. Ver el paso 3 de **"Reglas de negocio"**, en la sección "Tickets e inscripciones", para el detalle completo.


