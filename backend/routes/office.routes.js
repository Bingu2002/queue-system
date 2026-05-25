const router = require('express').Router();
const { getOffices, getOfficeById } = require('../controllers/office.controller');

router.get('/',    getOffices);
router.get('/:id', getOfficeById);

module.exports = router;