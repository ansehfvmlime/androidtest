const express = require('express');
const ctrl = require('../controllers/characterApiController');

const router = express.Router();

router.get('/characters/:name/summary', ctrl.getSummary);
router.get('/characters/:name/equipment', ctrl.getEquipment);
router.get('/characters/:name/spec', ctrl.getSpec);
router.get('/characters/:name/arkgrid', ctrl.getArkgrid);
router.get('/characters/:name/arkpassive', ctrl.getArkpassive);

router.post('/characters/:name/refresh', ctrl.refreshCache);

module.exports = router;
