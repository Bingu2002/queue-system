const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { issueToken, getMyToken, cancelToken } = require('../controllers/token.controller');

// Protect token issuance so citizenId links to the logged-in user
router.post('/', protect, issueToken);
router.get('/mine', protect, getMyToken);
router.delete('/:id', protect, cancelToken);

module.exports = router;