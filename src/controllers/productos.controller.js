const Producto = require('../models/Producto');
const Favorito = require('../models/Favorito');
const ApiError = require('../utils/ApiError');

// Únicos campos que el cliente puede enviar. Cualquier otro (_id, createdAt, etc.) se descarta.
const CAMPOS_PERMITIDOS = ['nombre', 'descripcion', 'categoria', 'precio'];
const CAMPOS_TEXTO = ['nombre', 'descripcion', 'categoria'];

/**
 * Toma del body solo los campos permitidos y revisa sus tipos antes de llegar a Mongoose
 * (así "precio": "10" o "nombre": 123 no se convierten en silencio).
 */
function extraerDatosProducto(body, { parcial }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'El cuerpo de la petición debe ser un objeto JSON');
  }

  const datos = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }

  const errores = [];
  for (const campo of CAMPOS_TEXTO) {
    if (campo in datos && typeof datos[campo] !== 'string') {
      errores.push({ campo, mensaje: `El campo ${campo} debe ser texto` });
    }
  }
  if ('precio' in datos && (typeof datos.precio !== 'number' || !Number.isFinite(datos.precio) || datos.precio <= 0)) {
    errores.push({ campo: 'precio', mensaje: 'El precio debe ser un número mayor que cero' });
  }
  if (errores.length) throw new ApiError(422, 'Datos inválidos', errores);

  if (parcial && Object.keys(datos).length === 0) {
    throw new ApiError(422, `Envía al menos uno de estos campos: ${CAMPOS_PERMITIDOS.join(', ')}`);
  }
  return datos;
}

// GET /api/productos?categoria=hogar  (público)
async function listar(req, res) {
  const filtro = {};
  const { categoria } = req.query;

  if (categoria !== undefined) {
    if (typeof categoria !== 'string' || !categoria.trim()) {
      throw new ApiError(400, 'El parámetro categoria debe ser un texto no vacío');
    }
    filtro.categoria = categoria.trim().toLowerCase();
  }

  const productos = await Producto.find(filtro).sort({ nombre: 1 });
  res.status(200).json({ ok: true, total: productos.length, data: productos });
}

// GET /api/productos/:id  (público)
async function obtener(req, res) {
  const producto = await Producto.findById(req.params.id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.status(200).json({ ok: true, data: producto });
}

// POST /api/productos  (admin)
async function crear(req, res) {
  const datos = extraerDatosProducto(req.body, { parcial: false });
  const producto = await Producto.create(datos); // Mongoose valida obligatorios -> 422
  res.status(201).json({ ok: true, data: producto });
}

// PUT /api/productos/:id  (admin)
async function actualizar(req, res) {
  const datos = extraerDatosProducto(req.body, { parcial: true });
  const producto = await Producto.findByIdAndUpdate(req.params.id, datos, {
    returnDocument: 'after', // devuelve el producto ya actualizado
    runValidators: true, // aplica las mismas reglas del esquema al actualizar
  });
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.status(200).json({ ok: true, data: producto });
}

/*
 * DELETE /api/productos/:id  (admin)
 * Regla de consistencia: al eliminar un producto también se eliminan los favoritos
 * que apuntaban a él, para que ningún usuario quede con un favorito "huérfano".
 * Se usa la colección "favoritos" (modelo Favorito del Integrante B, campo "producto").
 */
async function eliminar(req, res) {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  const { deletedCount } = await Favorito.deleteMany({ producto: producto._id });

  res.status(200).json({
    ok: true,
    data: { mensaje: 'Producto eliminado', id: producto.id, favoritosEliminados: deletedCount },
  });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
