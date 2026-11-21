const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/*
 * Protege las rutas que requieren sesión.
 *  - Lee la cabecera "Authorization: Bearer <token>"
 *  - jwt.verify comprueba la FIRMA (con JWT_SECRET) y la EXPIRACIÓN (campo exp)
 *  - Si todo está bien deja en req.usuario la identidad verificada: { id, rol }
 *    Los controladores toman al usuario SIEMPRE de aquí, nunca del body ni de la URL.
 */
function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Token no proporcionado'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = { id: payload.id, rol: payload.rol };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'El token ha vencido, inicia sesión nuevamente'));
    }
    next(new ApiError(401, 'Token inválido'));
  }
}

module.exports = verificarToken;
