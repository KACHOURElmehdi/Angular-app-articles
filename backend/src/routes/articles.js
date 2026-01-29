const express = require('express');
const { body } = require('express-validator');
const prisma = require('../prisma');
const { authRequired, authOptional } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { buildSlug } = require('../utils/slug');
const { formatArticle, formatComment } = require('../utils/format');

const router = express.Router();

const articleInclude = currentUserId => ({
  include: {
    author: { include: currentUserId ? { followers: { where: { followerId: currentUserId } } } : {} },
    tags: { include: { tag: true } },
    favorites: currentUserId ? { where: { userId: currentUserId } } : undefined,
    _count: { select: { favorites: true } },
  },
});

const articleFilters = (query, currentUserId) => {
  const where = {};

  if (query.tag) {
    where.tags = { some: { tag: { name: query.tag } } };
  }

  if (query.author) {
    where.author = { username: query.author };
  }

  if (query.favorited) {
    where.favorites = { some: { user: { username: query.favorited } } };
  }

  if (query.status) {
    where.status = query.status;
  }

  return where;
};

const createArticleValidation = [
  body('article.title').notEmpty().withMessage('title is required'),
  body('article.body').notEmpty().withMessage('body is required'),
  body('article.description').optional().isString(),
  body('article.tagList').optional().isArray().withMessage('tagList must be an array'),
];

const updateArticleValidation = [
  body('article.title').optional().isString(),
  body('article.body').optional().isString(),
  body('article.description').optional().isString(),
  body('article.tagList').optional().isArray(),
];

const commentValidation = [body('comment.body').notEmpty().withMessage('comment body is required')];

const loadArticleBySlug = async (slug, currentUserId) =>
  prisma.article.findUnique({
    where: { slug },
    ...articleInclude(currentUserId),
  });

router.get('/articles', authOptional, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const offset = parseInt(req.query.offset || '0', 10);

    const where = articleFilters(req.query, req.user?.id);

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        ...articleInclude(req.user?.id),
      }),
      prisma.article.count({ where }),
    ]);

    return res.json({
      articles: articles.map(article => formatArticle(article, req.user?.id)),
      articlesCount,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/articles/feed', authRequired, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const offset = parseInt(req.query.offset || '0', 10);

    const where = {
      author: { followers: { some: { followerId: req.user.id } } },
    };

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        ...articleInclude(req.user.id),
      }),
      prisma.article.count({ where }),
    ]);

    return res.json({
      articles: articles.map(article => formatArticle(article, req.user.id)),
      articlesCount,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/articles/:slug', authOptional, async (req, res, next) => {
  try {
    const article = await loadArticleBySlug(req.params.slug, req.user?.id);
    if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

    return res.json({ article: formatArticle(article, req.user?.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/articles', authRequired, createArticleValidation, validateRequest, async (req, res, next) => {
  try {
    const payload = req.body.article;
    const tagList = Array.isArray(payload.tagList) ? [...new Set(payload.tagList)] : [];

    const tags = await Promise.all(
      tagList.map(name =>
        prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    const article = await prisma.article.create({
      data: {
        slug: buildSlug(payload.title),
        title: payload.title,
        description: payload.description || '',
        body: payload.body,
        status: payload.status || 'draft',
        authorId: req.user.id,
        tags: {
          create: tags.map(tag => ({
            tag: { connect: { id: tag.id } },
          })),
        },
      },
      ...articleInclude(req.user.id),
    });

    return res.status(201).json({ article: formatArticle(article, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.put('/articles/:slug', authRequired, updateArticleValidation, validateRequest, async (req, res, next) => {
  try {
    const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ errors: { body: ['Article not found'] } });
    if (existing.authorId !== req.user.id) return res.status(403).json({ errors: { body: ['Forbidden'] } });

    const payload = req.body.article || {};
    const data = {};

    if (payload.title) {
      data.title = payload.title;
      data.slug = buildSlug(payload.title);
    }
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.body !== undefined) data.body = payload.body;
    if (payload.status) data.status = payload.status;

    if (payload.tagList) {
      const tagList = [...new Set(payload.tagList)];
      const tags = await Promise.all(
        tagList.map(name =>
          prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );

      data.tags = {
        deleteMany: {},
        create: tags.map(tag => ({ tag: { connect: { id: tag.id } } })),
      };
    }

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data,
      ...articleInclude(req.user.id),
    });

    return res.json({ article: formatArticle(updated, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/articles/:slug', authRequired, async (req, res, next) => {
  try {
    const existing = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ errors: { body: ['Article not found'] } });
    if (existing.authorId !== req.user.id) return res.status(403).json({ errors: { body: ['Forbidden'] } });

    await prisma.article.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

router.post('/articles/:slug/favorite', authRequired, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

    await prisma.favorite.upsert({
      where: { userId_articleId: { userId: req.user.id, articleId: article.id } },
      update: {},
      create: { userId: req.user.id, articleId: article.id },
    });

    const fresh = await loadArticleBySlug(req.params.slug, req.user.id);
    return res.json({ article: formatArticle(fresh, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/articles/:slug/favorite', authRequired, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, articleId: article.id },
    });

    const fresh = await loadArticleBySlug(req.params.slug, req.user.id);
    return res.json({ article: formatArticle(fresh, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.get('/articles/:slug/comments', authOptional, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: req.user ? { followers: { where: { followerId: req.user.id } } } : undefined,
        },
      },
    });

    return res.json({
      comments: comments.map(comment => formatComment(comment, req.user?.id)),
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/articles/:slug/comments',
  authRequired,
  commentValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
      if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

      const comment = await prisma.comment.create({
        data: {
          body: req.body.comment.body,
          articleId: article.id,
          authorId: req.user.id,
        },
        include: {
          author: {
            include: { followers: { where: { followerId: req.user.id } } },
          },
        },
      });

      return res.status(201).json({ comment: formatComment(comment, req.user.id) });
    } catch (err) {
      return next(err);
    }
  },
);

router.delete('/articles/:slug/comments/:id', authRequired, async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
    if (!article) return res.status(404).json({ errors: { body: ['Article not found'] } });

    const commentId = parseInt(req.params.id, 10);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.articleId !== article.id)
      return res.status(404).json({ errors: { body: ['Comment not found'] } });

    if (comment.authorId !== req.user.id) return res.status(403).json({ errors: { body: ['Forbidden'] } });

    await prisma.comment.delete({ where: { id: commentId } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
