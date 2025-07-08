const express = require('express');
const router = express.Router();
const { signup, signin, getMe, createAdmin } = require('../controllers/auth');
const { protect, authorize } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', protect, getMe);
router.post('/create-admin', protect, authorize('admin'), createAdmin);

module.exports = router; 