/*
 * Carga productos de ejemplo (datos ficticios).
 * Uso: npm run seed
 * Es idempotente: si un producto con el mismo nombre ya existe, no se duplica.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const conectarDB = require('../src/config/db');
const Producto = require('../src/models/Producto');

const productos = [
  { nombre: 'Audífonos Inalámbricos Nova', descripcion: 'Audífonos bluetooth con cancelación de ruido y 30 h de batería.', categoria: 'tecnologia', precio: 59.99 },
  { nombre: 'Teclado Mecánico Kappa', descripcion: 'Teclado mecánico compacto con switches rojos y retroiluminación.', categoria: 'tecnologia', precio: 74.5 },
  { nombre: 'Lámpara de Escritorio Luma', descripcion: 'Lámpara LED regulable con tres tonos de luz.', categoria: 'hogar', precio: 24.9 },
  { nombre: 'Juego de Sartenes Ceramix', descripcion: 'Set de tres sartenes antiadherentes de cerámica.', categoria: 'hogar', precio: 45 },
  { nombre: 'Mochila Urbana Trek', descripcion: 'Mochila impermeable con compartimento para laptop de 15".', categoria: 'accesorios', precio: 38.75 },
  { nombre: 'Botella Térmica Polar', descripcion: 'Botella de acero inoxidable que mantiene el frío 24 h.', categoria: 'accesorios', precio: 15.2 },
  { nombre: 'Novela "El Faro del Sur"', descripcion: 'Novela ficticia de misterio ambientada en la costa.', categoria: 'libros', precio: 12.99 },
];

async function main() {
  await conectarDB();
  let creados = 0;
  for (const p of productos) {
    const r = await Producto.updateOne(
      { nombre: p.nombre },
      { $setOnInsert: p },
      { upsert: true, runValidators: true }
    );
    creados += r.upsertedCount;
  }
  const total = await Producto.countDocuments();
  console.log(`Seed completado: ${creados} productos nuevos, ${total} en total.`);
}

main()
  .catch((err) => {
    console.error('Error en el seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
