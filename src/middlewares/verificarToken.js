const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

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
