const mongoose = require('mongoose');
const Favorito = require('../models/Favorito');
const Producto = require('../models/Producto');
const ApiError = require('../utils/ApiError');

/*
 * Control de propiedad: TODAS las consultas filtran por req.usuario.id, que viene del JWT
 * verificado por verificarToken. El usuario nunca se toma del body ni de la URL, así que
 * un usuario solo puede ver, crear y borrar sus propios favoritos.
 */

// GET /api/favoritos  (autenticado)
async function listar(req, res) {
  const favoritos = await Favorito.find({ usuario: req.usuario.id })
    .sort({ createdAt: -1 })
    .populate('producto');
  res.status(200).json({ ok: true, total: favoritos.length, data: favoritos });
}

// POST /api/favoritos  { productoId }  (autenticado)
async function agregar(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ApiError(400, 'El cuerpo de la petición debe ser un objeto JSON');
  }
  const { productoId } = req.body;

  if (productoId === undefined || productoId === null || productoId === '') {
    throw new ApiError(422, 'Datos inválidos', [{ campo: 'productoId', mensaje: 'El productoId es obligatorio' }]);
  }
  if (typeof productoId !== 'string' || !mongoose.isValidObjectId(productoId)) {
    throw new ApiError(400, 'El identificador "productoId" no tiene un formato válido');
  }

  const producto = await Producto.findById(productoId);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  let favorito;
  try {
    favorito = await Favorito.create({ usuario: req.usuario.id, producto: producto._id });
  } catch (err) {
    // El índice único { usuario, producto } rechaza el duplicado
    if (err.code === 11000) throw new ApiError(409, 'El producto ya está en tus favoritos');
    throw err;
  }

  await favorito.populate('producto');
  res.status(201).json({ ok: true, data: favorito });
}

// DELETE /api/favoritos/:productoId  (autenticado)
async function quitar(req, res) {
  const { productoId } = req.params;

  // El filtro incluye al usuario del token: si el favorito es de otra persona, no se encuentra
  const { deletedCount } = await Favorito.deleteOne({ usuario: req.usuario.id, producto: productoId });
  if (deletedCount === 0) throw new ApiError(404, 'El producto no está en tus favoritos');

  res.status(200).json({ ok: true, data: { mensaje: 'Producto quitado de favoritos', productoId } });
}

module.exports = { listar, agregar, quitar };
