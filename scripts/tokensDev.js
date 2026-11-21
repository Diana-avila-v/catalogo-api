/*
 * SOLO PARA DESARROLLO Y PRUEBAS LOCALES.
 * Genera tokens firmados con el JWT_SECRET de tu .env para probar las rutas protegidas
 * sin pasar por /auth/login:
 *   - tokenAdmin:   del administrador real creado con "npm run crear-admin"
 *   - tokenUsuario: de un usuario ficticio con rol "usuario" (para probar el 403)
 *   - tokenVencido: un token que ya expiró (para probar el 401)
 *
 * Uso: npm run tokens-dev
 * Requiere acceso al .env (al secreto), así que no abre ningún acceso que el servidor no tenga ya.
 * Los tokens se imprimen en consola: no los subas al repositorio ni los muestres en el video.
 */
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const conectarDB = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

async function main() {
  const { JWT_SECRET, JWT_EXPIRES_IN = '1h', ADMIN_CORREO } = process.env;
  if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en el .env');

  await conectarDB();
  const admin = await Usuario.findOne({ correo: (ADMIN_CORREO || '').toLowerCase(), rol: 'admin' });
  if (!admin) throw new Error('No existe el administrador. Ejecuta primero: npm run crear-admin');

  const firmar = (payload, opciones) => jwt.sign(payload, JWT_SECRET, opciones);

  const tokenAdmin = firmar({ id: admin.id, rol: 'admin' }, { expiresIn: JWT_EXPIRES_IN });
  const tokenUsuario = firmar({ id: new mongoose.Types.ObjectId().toString(), rol: 'usuario' }, { expiresIn: JWT_EXPIRES_IN });
  const tokenVencido = firmar(
    { id: admin.id, rol: 'admin', exp: Math.floor(Date.now() / 1000) - 60 } // venció hace 1 minuto
  );

  console.log('\nCopia estos valores en el entorno de Postman (columna "Current value"):\n');
  console.log(`tokenAdmin   = ${tokenAdmin}\n`);
  console.log(`tokenUsuario = ${tokenUsuario}\n`);
  console.log(`tokenVencido = ${tokenVencido}\n`);
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
