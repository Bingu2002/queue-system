const router      = require('express').Router();
const { protect } = require('../middleware/auth');
const { issueToken, getMyToken, cancelToken } = require('../controllers/token.controller');

// Anyone (including guests) can take a token — no login required
router.post('/',       issueToken);

// These two need a logged-in citizen
router.get('/mine',    protect, getMyToken);
router.delete('/:id',  protect, cancelToken);

module.exports = router;