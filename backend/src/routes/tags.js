const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/tags', async (_req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return res.json({ tags: tags.map(t => t.name) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
