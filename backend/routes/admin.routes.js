const router = require('express').Router();
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { createOffice, createService, getAnalytics } = require('../controllers/admin.controller');

router.post('/offices',          protect, authorize('admin','superadmin'), createOffice);
router.post('/services',         protect, authorize('admin','superadmin'), createService);
router.get('/analytics/:officeId', protect, authorize('admin','superadmin'), getAnalytics);

module.exports = router;
