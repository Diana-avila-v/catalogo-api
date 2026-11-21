const { Router } = require('express');
const ctrl = require('../controllers/favoritos.controller');
const verificarToken = require('../middlewares/verificarToken');
const validarObjectId = require('../middlewares/validarObjectId');

const router = Router();

// Todas las rutas de favoritos requieren sesión: el usuario sale del token (req.usuario.id)
router.use(verificarToken);

router.get('/', ctrl.listar);
router.post('/', ctrl.agregar);
router.delete('/:productoId', validarObjectId('productoId'), ctrl.quitar);

module.exports = router;
