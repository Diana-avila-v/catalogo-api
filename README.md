# Catálogo de productos con favoritos y acceso por roles

API REST con **Node.js, Express y MongoDB (Mongoose)** para gestionar un catálogo de productos y los favoritos personales de cada usuario, con autenticación JWT y autorización por roles.

## Integrantes

| Integrante | Aportes principales |
|---|---|
| Jenniffer Pincay | Estructura del proyecto, conexión a MongoDB, modelos `Producto` y `Usuario`, CRUD y filtro de productos, middlewares `verificarToken` y `soloAdmin`, manejo global de errores, scripts de seed, administrador y tokens de desarrollo, pruebas de Postman de productos |
| Diana Avila | Registro e inicio de sesión (hash con bcrypt y emisión del JWT), modelo `Favorito`, rutas de favoritos con control de propiedad, pruebas de Postman de autenticación, favoritos y aislamiento entre usuarios |

## Propósito

- Cualquier persona puede consultar el catálogo y filtrarlo por categoría.
- Solo el administrador puede crear, actualizar y eliminar productos.
- Cada usuario autenticado gestiona su propia lista de favoritos.

## Elección de base de datos: MongoDB con Mongoose

- **Validación en el esquema:** `required`, `maxlength`, `lowercase` y validadores propios (por ejemplo, precio mayor que cero) se declaran en el modelo y se aplican también al actualizar (`runValidators`).
- **Índices únicos:** el correo único y el par `{usuario, producto}` en favoritos los garantiza la base de datos, así que no puede haber duplicados aunque lleguen dos peticiones al mismo tiempo.
- **Documentos JSON:** los datos se guardan con la misma forma que usa la API, sin necesidad de traducir a tablas ni escribir migraciones.
- **Campos limitados:** los controladores solo aceptan los campos permitidos del `req.body` y descartan el resto (`_id`, `rol`, etc.).

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- MongoDB 6 o superior en local, o una base de datos en MongoDB Atlas
- Postman (para las pruebas)

## Instalación

```bash
git clone https://github.com/Diana-avila-v/catalogo-api.git
cd catalogo-api
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Luego edita `.env` con tus valores.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://127.0.0.1:27017/catalogo` |
| `JWT_SECRET` | Secreto para firmar los tokens (largo y aleatorio) | — |
| `JWT_EXPIRES_IN` | Tiempo de vida del token | `1h` |
| `ADMIN_NOMBRE` | Nombre del administrador inicial | `Administrador` |
| `ADMIN_CORREO` | Correo del administrador inicial | `admin@catalogo.test` |
| `ADMIN_PASSWORD` | Contraseña del administrador (mínimo 8 caracteres) | — |

El archivo `.env` está en `.gitignore` y **nunca** se sube al repositorio.

## Inicialización de datos y del administrador

```bash
npm run seed          # carga 7 productos ficticios (no duplica si se ejecuta otra vez)
npm run crear-admin   # crea el administrador con ADMIN_CORREO / ADMIN_PASSWORD
```

El rol `admin` **solo** se puede obtener con este script. El registro público siempre crea usuarios con rol `usuario`. Si el correo ya existe, el script lo convierte en administrador y actualiza su contraseña.

**Tokens de desarrollo (opcional):** `npm run tokens-dev` imprime un `tokenAdmin`, un `tokenUsuario` y un `tokenVencido` firmados con el `JWT_SECRET` de tu `.env`. Sirve para probar las rutas protegidas sin usar `/auth/login`, y es la forma de obtener un token ya vencido para la prueba del 401. Requiere el `.env` y que exista el administrador, y los tokens solo se imprimen en tu consola: no los subas al repositorio.

## Ejecución

```bash
npm start      # modo normal
npm run dev    # modo desarrollo con nodemon
```

La API queda disponible en `http://localhost:3000/api`.

## Estructura del proyecto

```
src/
  app.js                 configuración de Express y middlewares globales
  server.js              conexión a la BD y arranque del servidor
  config/db.js           conexión a MongoDB
  models/                esquemas de Mongoose (Producto, Usuario, Favorito)
  controllers/           lógica de cada recurso
  routes/                definición de rutas
  middlewares/           verificarToken, soloAdmin, validarObjectId, errorHandler
  utils/ApiError.js      error con código HTTP
scripts/
  seed.js                productos de ejemplo
  crearAdmin.js          creación del administrador
  tokensDev.js           tokens de prueba (solo desarrollo)
postman/                 colección y entorno de ejemplo
```

## Formato de las respuestas

Respuesta correcta:
```json
{ "ok": true, "data": { ... } }
```
Respuesta de error:
```json
{ "ok": false, "error": { "mensaje": "Datos inválidos", "detalles": [ { "campo": "precio", "mensaje": "El precio debe ser un número mayor que cero" } ] } }
```

### Criterio de códigos HTTP

| Código | Cuándo se usa |
|---|---|
| 200 | Consulta, actualización o eliminación exitosa |
| 201 | Creación exitosa |
| 400 | Petición mal formada: JSON inválido, identificador con formato incorrecto, parámetro de filtro vacío |
| 401 | Sin token, token inválido o vencido |
| 403 | Token válido pero sin permiso (rol `usuario` intentando modificar el catálogo) |
| 404 | El recurso no existe |
| 409 | Duplicado (correo ya registrado, favorito repetido) |
| 422 | JSON válido pero los datos no cumplen las reglas (campos vacíos, precio ≤ 0, tipo incorrecto) |
| 500 | Error interno: se registra en el servidor y al cliente solo se le da un mensaje genérico |

## Rutas

### Productos

| Método y ruta | Acceso | Cuerpo | Respuesta correcta | Errores |
|---|---|---|---|---|
| `GET /api/productos` | Público | — | 200 `{ ok, total, data: [productos] }` | 400 si `categoria` está vacía |
| `GET /api/productos?categoria=hogar` | Público | — | 200, solo productos de esa categoría (no distingue mayúsculas) | |
| `GET /api/productos/:id` | Público | — | 200 `{ ok, data: producto }` | 400 id inválido, 404 |
| `POST /api/productos` | Admin | `{ nombre, descripcion, categoria, precio }` (todos obligatorios) | 201 `{ ok, data: producto }` | 401, 403, 422 |
| `PUT /api/productos/:id` | Admin | Uno o más de: `nombre, descripcion, categoria, precio` | 200 `{ ok, data: producto }` | 400, 401, 403, 404, 422 |
| `DELETE /api/productos/:id` | Admin | — | 200 `{ ok, data: { mensaje, id, favoritosEliminados } }` | 400, 401, 403, 404 |

Ejemplo de producto:
```json
{
  "id": "6650f1c2a1b2c3d4e5f60718",
  "nombre": "Lámpara de Escritorio Luma",
  "descripcion": "Lámpara LED regulable con tres tonos de luz.",
  "categoria": "hogar",
  "precio": 24.9,
  "createdAt": "2026-11-20T21:24:03.239Z",
  "updatedAt": "2026-11-20T21:24:03.239Z"
}
```

**¿Qué pasa con los favoritos al eliminar un producto?** Se eliminan en cascada: `DELETE /api/productos/:id` borra también todos los favoritos que apuntaban a ese producto, para que ningún usuario quede con referencias a un producto inexistente. La respuesta indica cuántos se eliminaron (`favoritosEliminados`).

### Autenticación y favoritos

#### Autenticación

| Método y ruta | Acceso | Cuerpo | Respuesta correcta | Errores |
|---|---|---|---|---|
| `POST /api/auth/registro` | Público | `{ nombre, correo, password }` (todos obligatorios; `password` de texto con al menos 8 caracteres) | 201 `{ ok, data: usuario }` (siempre con rol `usuario`) | 400 JSON inválido, 409 correo ya registrado, 422 |
| `POST /api/auth/login` | Público | `{ correo, password }` | 200 `{ ok, data: { token, usuario } }` | 400 JSON inválido, 401 credenciales incorrectas, 422 faltan datos |

Ejemplo de registro:
```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@correo.test",
  "password": "Clave12345"
}
```

Ejemplo de login:
```json
{
  "correo": "ana@correo.test",
  "password": "Clave12345"
}
```

- La contraseña se guarda como hash con **bcrypt**; ninguna respuesta incluye la contraseña ni el hash.
- El registro **siempre** crea el rol `usuario`: si el cliente envía `"rol": "admin"` se ignora. El administrador solo se crea con `npm run crear-admin`.
- El token es un JWT firmado con `JWT_SECRET` (HS256) que contiene `{ id, rol }` y vence según `JWT_EXPIRES_IN`. Se envía en la cabecera `Authorization: Bearer <token>`.
- Si el correo no existe o la contraseña es incorrecta, la respuesta es la misma (401 `Credenciales incorrectas`), para no revelar qué correos están registrados.

#### Favoritos

| Método y ruta | Acceso | Cuerpo | Respuesta correcta | Errores |
|---|---|---|---|---|
| `GET /api/favoritos` | Autenticado | — | 200 `{ ok, total, data: [favoritos] }` con el producto completo en cada favorito | 401 |
| `POST /api/favoritos` | Autenticado | `{ productoId }` | 201 `{ ok, data: favorito }` | 400 id con formato inválido, 401, 404 producto inexistente, 409 ya es favorito, 422 falta `productoId` |
| `DELETE /api/favoritos/:productoId` | Autenticado | — | 200 `{ ok, data: { mensaje, productoId } }` | 400 id inválido, 401, 404 no está en tus favoritos |

Ejemplo para agregar un favorito:
```json
{
  "productoId": "6650f1c2a1b2c3d4e5f60718"
}
```

**¿Cómo se garantiza que cada usuario solo accede a sus favoritos?**

- Todas las rutas de favoritos pasan por `verificarToken`, que comprueba la firma del JWT y deja en `req.usuario` el `id` del usuario. Ese `id` no se puede falsificar sin conocer `JWT_SECRET`.
- El usuario se toma **solo** de `req.usuario.id`, nunca del cuerpo ni de la URL. Si el cliente envía un campo `usuario`, se ignora.
- Cada consulta filtra por ese usuario: listar usa `{ usuario }`, y quitar usa `deleteOne({ usuario, producto })`. Si el usuario B intenta quitar un favorito del usuario A, el filtro no encuentra nada y la respuesta es 404, sin revelar que el favorito existe.
- El índice único `{ usuario, producto }` impide que un usuario tenga el mismo producto dos veces (409), incluso con peticiones simultáneas.

## Pruebas con Postman

1. Importa `postman/catalogo.postman_collection.json` y `postman/catalogo.postman_environment.example.json`.
2. Selecciona el entorno **"Catálogo - local (ejemplo)"** y escribe en `adminPassword` la contraseña que pusiste en `ADMIN_PASSWORD` (solo en tu Postman, no en el archivo del repositorio).
3. Ejecuta `npm run seed`, `npm run crear-admin` y `npm run tokens-dev`, y pega el `tokenVencido` en el entorno.
4. Con el servidor encendido (`npm start`), ejecuta la colección con el **Collection Runner** en orden. La carpeta `00 Preparación` obtiene `tokenAdmin` y `tokenUsuario` por medio del login. Si solo quieres probar productos, omite la carpeta 00 y pega también `tokenAdmin` y `tokenUsuario` desde `npm run tokens-dev`.
5. **Persistencia:** ejecuta `05 › 1. Crear producto de persistencia`, detén el servidor con `Ctrl+C`, vuelve a iniciarlo con `npm start` y ejecuta `05 › 2. Consultar después de reiniciar`.

También se puede ejecutar desde la terminal con newman:
```bash
npx newman run postman/catalogo.postman_collection.json -e postman/catalogo.postman_environment.example.json \
  --env-var adminPassword=TU_CLAVE --env-var tokenVencido=TOKEN_DE_tokens-dev
```

| Carpeta | Casos que cubre |
|---|---|
| 00 Preparación | Login del administrador y de un usuario normal |
| 01 Consulta pública | Listado sin token, filtro por categoría, consulta por id, producto inexistente (404), id inválido (400) |
| 02 CRUD admin | Crear (201), consultar, actualizar (200), actualizar inexistente (404), eliminar (200), consultar eliminado (404) |
| 03 Validaciones | Precio 0, negativo o de texto (422), campos vacíos (422), PUT sin campos (422), JSON mal formado (400) |
| 04 Permisos | Crear sin token, con token vencido o con token alterado (401); crear, actualizar y eliminar con rol usuario (403); el producto sigue existiendo |
| 05 Persistencia | Producto creado antes de reiniciar sigue disponible después |
| 06 Autenticación | Registro correcto (201); registro enviando `rol: admin` queda como `usuario`; correo duplicado (409); campos vacíos, correo inválido, sin contraseña o contraseña corta (422); login correcto con token (200); contraseña incorrecta o correo no registrado (401); ninguna respuesta contiene la contraseña ni el hash |
| 07 Favoritos | Sin token (401); agregar (201); listar con el producto completo (200); duplicado (409); producto inexistente (404); id con formato inválido (400); sin `productoId` (422); quitar (200) |
| 08 Aislamiento A/B | Usuarios A y B con correos únicos; A agrega un favorito; B no lo ve y no puede quitarlo (404); el favorito de A sigue existiendo |

## Recursos de apoyo

- Documentación de [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/docs/) y [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).
- Se usó un asistente de IA (Claude) como apoyo para la estructura inicial; todo el código fue revisado, probado y explicado por los integrantes.
