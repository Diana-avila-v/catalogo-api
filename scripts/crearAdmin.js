/*
 * Crea (o actualiza) el usuario administrador a partir de variables de entorno.
 * Uso: npm run crear-admin
 * Es la ÚNICA forma de obtener el rol "admin": el registro público siempre crea rol "usuario".
 */
require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

async function main() {
  const { ADMIN_NOMBRE = 'Administrador', ADMIN_CORREO, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_CORREO || !ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_CORREO y ADMIN_PASSWORD en el archivo .env');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  await conectarDB();

  const correo = ADMIN_CORREO.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existente = await Usuario.findOne({ correo });
  if (existente) {
    existente.rol = 'admin';
    existente.passwordHash = passwordHash;
    await existente.save();
    console.log(`Usuario ${correo} actualizado con rol admin.`);
  } else {
    await Usuario.create({ nombre: ADMIN_NOMBRE, correo, passwordHash, rol: 'admin' });
    console.log(`Administrador ${correo} creado.`);
  }
}

main()
  .catch((err) => {
    console.error('Error al crear el administrador:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
