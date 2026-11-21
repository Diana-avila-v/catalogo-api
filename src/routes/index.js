const { Router } = require('express');
const productosRoutes = require('./productos.routes');
const authRoutes = require('./auth.routes');
const favoritosRoutes = require('./favoritos.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, data: { mensaje: 'API Catálogo de productos' } });
});

router.use('/productos', productosRoutes);
router.use('/auth', authRoutes);
router.use('/favoritos', favoritosRoutes);

module.exports = router;
