const mongoose = require('mongoose');

async function conectarDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
  }
  // Solo se aceptan en los filtros los campos definidos en los esquemas
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');
}

module.exports = conectarDB;
