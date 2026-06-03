const router        = require('express').Router();
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const {
  callNext,
  updateTokenStatus,
  getCurrentQueue,
  toggleQueue
} = require('../controllers/queue.controller');

// Officer routes
router.post('/next',        protect, authorize('officer','admin'), callNext);
router.put('/status/:id',   protect, authorize('officer','admin'), updateTokenStatus);
router.get('/current',      protect, authorize('officer','admin'), getCurrentQueue);

// Admin-only: open/close the queue
router.put('/toggle',       protect, authorize('admin','superadmin'), toggleQueue);

module.exports = router;