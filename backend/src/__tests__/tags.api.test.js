const request = require('supertest');

describe('API integration: tags', () => {
  afterAll(async () => {
    // Close Prisma client to let Jest exit.
    const prisma = require('../prisma');
    await prisma.$disconnect();
  });

  it('GET /api/tags returns tags array', async () => {
    const prisma = require('../prisma');
    try {
      await prisma.tag.upsert({
        where: { name: 'jest-tag' },
        update: {},
        create: { name: 'jest-tag' },
      });
    } catch (err) {
      // Make failures actionable: this test needs the sqlite schema in place.
      // If you see "no such table", run: `cd backend && npm run migrate` (Prisma db push).
      throw err;
    }

    const { app } = require('../server');
    const res = await request(app).get('/api/tags').expect(200);
    expect(res.body).toHaveProperty('tags');
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toContain('jest-tag');
  });
});
