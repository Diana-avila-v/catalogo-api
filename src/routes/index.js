const { Router } = require('express');
const productosRoutes = require('./productos.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, data: { mensaje: 'API Catálogo de productos' } });
});

router.use('/productos', productosRoutes);

// Integrante B agrega aquí sus rutas:
// router.use('/auth', require('./auth.routes'));
// router.use('/favoritos', require('./favoritos.routes'));

module.exports = router;
