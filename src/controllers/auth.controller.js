const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');

const RONDAS_BCRYPT = 10; // mismo costo que scripts/crearAdmin.js
const MIN_CONTRASENA = 8;
const MAX_BYTES_CONTRASENA = 72; // bcrypt ignora todo lo que pase de 72 bytes

const HASH_RELLENO = bcrypt.hashSync('contrasena-de-relleno', RONDAS_BCRYPT);

function exigirObjeto(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'El cuerpo de la petición debe ser un objeto JSON');
  }
}

// POST /api/auth/registro  (público)
async function registro(req, res) {
  exigirObjeto(req.body);
  // Solo se toman estos tres campos: cualquier "rol", "_id", etc. que envíe el cliente se ignora
  const { nombre, correo, password } = req.body;

  const errores = [];
  if (nombre !== undefined && typeof nombre !== 'string') {
    errores.push({ campo: 'nombre', mensaje: 'El campo nombre debe ser texto' });
  }
  if (correo !== undefined && typeof correo !== 'string') {
    errores.push({ campo: 'correo', mensaje: 'El campo correo debe ser texto' });
  }
  if (password === undefined || password === null || password === '') {
    errores.push({ campo: 'contraseña', mensaje: 'La contraseña es obligatoria' });
  } else if (typeof password !== 'string') {
    errores.push({ campo: 'contraseña', mensaje: 'La contraseña debe ser texto' });
  } else if (password.length < MIN_CONTRASENA) {
    errores.push({ campo: 'contraseña', mensaje: `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres` });
  } else if (Buffer.byteLength(password, 'utf8') > MAX_BYTES_CONTRASENA) {
    errores.push({ campo: 'contraseña', mensaje: `La contraseña no puede superar ${MAX_BYTES_CONTRASENA} bytes` });
  }
  if (errores.length) throw new ApiError(422, 'Datos inválidos', errores);

  const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);

  
  const usuario = await Usuario.create({ nombre, correo, passwordHash, rol: 'usuario' });

  res.status(201).json({ ok: true, data: usuario }); 
}

// POST /api/auth/login  (público)
async function login(req, res) {
  exigirObjeto(req.body);
  const { correo, password } = req.body;

  const errores = [];
  if (typeof correo !== 'string' || !correo.trim()) {
    errores.push({ campo: 'correo', mensaje: 'El correo es obligatorio y debe ser texto' });
  }
  if (typeof password !== 'string' || !password) {
    errores.push({ campo: 'contraseña', mensaje: 'La contraseña es obligatoria y debe ser texto' });
  }
  if (errores.length) throw new ApiError(422, 'Datos inválidos', errores);

  const usuario = await Usuario.findOne({ correo: correo.trim().toLowerCase() }).select('+passwordHash');

  const coincide = await bcrypt.compare(password, usuario ? usuario.passwordHash : HASH_RELLENO);
  if (!usuario || !coincide) {
    throw new ApiError(401, 'Credenciales incorrectas');
  }

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  res.status(200).json({ ok: true, data: { token, usuario } }); // toJSON elimina passwordHash
}

module.exports = { registro, login };
