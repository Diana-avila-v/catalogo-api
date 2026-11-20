const express = require('express');
const rutas = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.use('/api', rutas);

// Siempre al final: 404 de rutas y manejador global de errores
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
