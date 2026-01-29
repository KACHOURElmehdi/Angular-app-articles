const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { buildSlug } = require('../src/utils/slug');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password', 10);

  const user = await prisma.user.create({
    data: {
      username: 'demo',
      email: 'demo@example.com',
      passwordHash,
      bio: 'Demo account',
      image: '',
    },
  });

  await prisma.tag.createMany({
    data: [{ name: 'angular' }, { name: 'node' }, { name: 'sqlite' }],
  });

  const tags = await prisma.tag.findMany({ where: { name: { in: ['angular', 'node', 'sqlite'] } } });

  const firstArticleTags = tags.filter(t => ['angular', 'node'].includes(t.name));
  const secondArticleTags = tags.filter(t => ['sqlite'].includes(t.name));

  await prisma.article.create({
    data: {
      slug: buildSlug('Welcome to RealWorld'),
      title: 'Welcome to RealWorld',
      description: 'A demo article to get you started',
      body: 'This API is powered by Express, Prisma, and SQLite.',
      status: 'published',
      authorId: user.id,
      tags: {
        create: firstArticleTags.map(tag => ({ tag: { connect: { id: tag.id } } })),
      },
    },
  });

  await prisma.article.create({
    data: {
      slug: buildSlug('Second post'),
      title: 'Second post',
      description: 'Another sample article',
      body: 'Feel free to edit or delete this article after logging in.',
      status: 'draft',
      authorId: user.id,
      tags: {
        create: secondArticleTags.map(tag => ({ tag: { connect: { id: tag.id } } })),
      },
    },
  });

  console.log('Database seeded. Login with demo@example.com / password');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
