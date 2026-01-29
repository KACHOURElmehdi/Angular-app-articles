const express = require('express');
const prisma = require('../prisma');
const { authRequired, authOptional } = require('../middleware/auth');
const { formatProfile } = require('../utils/format');

const router = express.Router();

router.get('/profiles/:username', authOptional, async (req, res, next) => {
  try {
    const profileUser = await prisma.user.findUnique({
      where: { username: req.params.username },
      include: {
        followers: req.user
          ? {
              where: { followerId: req.user.id },
            }
          : undefined,
      },
    });

    if (!profileUser) return res.status(404).json({ errors: { body: ['Profile not found'] } });

    return res.json({ profile: formatProfile(profileUser, req.user?.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/profiles/:username/follow', authRequired, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) return res.status(404).json({ errors: { body: ['Profile not found'] } });
    if (target.id === req.user.id) return res.status(400).json({ errors: { body: ["You can't follow yourself"] } });

    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: req.user.id, followingId: target.id },
      },
      update: {},
      create: { followerId: req.user.id, followingId: target.id },
    });

    const enriched = await prisma.user.findUnique({
      where: { id: target.id },
      include: { followers: { where: { followerId: req.user.id } } },
    });

    return res.json({ profile: formatProfile(enriched, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/profiles/:username/follow', authRequired, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) return res.status(404).json({ errors: { body: ['Profile not found'] } });

    await prisma.follow.deleteMany({
      where: { followerId: req.user.id, followingId: target.id },
    });

    const enriched = await prisma.user.findUnique({
      where: { id: target.id },
      include: { followers: { where: { followerId: req.user.id } } },
    });

    return res.json({ profile: formatProfile(enriched, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
