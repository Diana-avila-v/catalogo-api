const { Router } = require('express');
const ctrl = require('../controllers/productos.controller');
const verificarToken = require('../middlewares/verificarToken');
const soloAdmin = require('../middlewares/soloAdmin');
const validarObjectId = require('../middlewares/validarObjectId');

const router = Router();

// Públicas: el catálogo se consulta sin iniciar sesión
router.get('/', ctrl.listar);
router.get('/:id', validarObjectId('id'), ctrl.obtener);

// Solo administrador: primero se verifica el JWT (401) y luego el rol (403)
router.post('/', verificarToken, soloAdmin, ctrl.crear);
router.put('/:id', verificarToken, soloAdmin, validarObjectId('id'), ctrl.actualizar);
router.delete('/:id', verificarToken, soloAdmin, validarObjectId('id'), ctrl.eliminar);

module.exports = router;
