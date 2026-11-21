const ApiError = require('../utils/ApiError');

/*
 * Control de rol. Se usa SIEMPRE después de verificarToken, que deja en
 * req.usuario el contenido verificado del JWT: { id, rol }.
 * El rol sale del token firmado, nunca de algo que envíe el cliente.
 */
function soloAdmin(req, res, next) {
  if (!req.usuario) {
    return next(new ApiError(401, 'Se requiere autenticación'));
  }
  if (req.usuario.rol !== 'admin') {
    return next(new ApiError(403, 'Solo un administrador puede realizar esta acción'));
  }
  next();
}

module.exports = soloAdmin;
