const { Router } = require('express');
const productosRoutes = require('./productos.routes');
const authRoutes = require('./auth.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, data: { mensaje: 'API Catálogo de productos' } });
});

router.use('/productos', productosRoutes);
router.use('/auth', authRoutes);

// Integrante B agrega aquí sus rutas:
// router.use('/favoritos', require('./favoritos.routes'));

module.exports = router;
