const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Rechaza con 400 los :id que no tienen formato de ObjectId de MongoDB
function validarObjectId(nombreParam = 'id') {
  return (req, res, next) => {
    const valor = req.params[nombreParam];
    if (!mongoose.isValidObjectId(valor)) {
      return next(new ApiError(400, `El identificador "${nombreParam}" no tiene un formato válido`));
    }
    next();
  };
}

module.exports = validarObjectId;
