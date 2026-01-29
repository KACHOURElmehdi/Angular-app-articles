const express = require('express');
const authRoutes = require('./auth');
const articleRoutes = require('./articles');
const profileRoutes = require('./profiles');
const tagsRoutes = require('./tags');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use(authRoutes);
router.use(articleRoutes);
router.use(profileRoutes);
router.use(tagsRoutes);

module.exports = router;
