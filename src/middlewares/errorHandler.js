const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/*
 * Formato único de error para toda la API:
 *   { "ok": false, "error": { "mensaje": "...", "detalles": [...] } }
 *
 * Criterio de códigos:
 *   400 -> la petición está mal formada (JSON inválido, id con formato incorrecto)
 *   422 -> el JSON es válido pero los datos no cumplen las reglas (campos vacíos, precio <= 0)
 *   404 -> el recurso no existe
 *   409 -> conflicto por duplicado (índice único)
 *   500 -> error interno (nunca se envían detalles internos al cliente)
 */

function rutaNoEncontrada(req, res, next) {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  let status = 500;
  let mensaje = 'Error interno del servidor';
  let detalles;

  if (err instanceof ApiError) {
    status = err.status;
    mensaje = err.message;
    detalles = err.detalles;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    mensaje = 'Datos inválidos';
    detalles = Object.values(err.errors).map((e) => ({
      campo: e.path,
      mensaje: e.kind === 'Number' || e.name === 'CastError'
        ? `El campo ${e.path} debe ser numérico`
        : e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    mensaje = `Valor inválido para el campo ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    mensaje = 'El registro ya existe';
    detalles = Object.keys(err.keyValue || {}).map((campo) => ({ campo }));
  }

  if (status === 500) {
    // Se registra en el servidor, pero al cliente solo se le da un mensaje genérico
    console.error(err);
  }

  const cuerpo = { ok: false, error: { mensaje } };
  if (detalles && detalles.length) cuerpo.error.detalles = detalles;
  res.status(status).json(cuerpo);
}

module.exports = { rutaNoEncontrada, manejadorErrores };
