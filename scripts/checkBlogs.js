require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const posts = await prisma.blog.findMany({ orderBy: { publishedAt: 'desc' } });
    console.log('FOUND', posts.length, 'posts');
    console.log(JSON.stringify(posts, null, 2));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();