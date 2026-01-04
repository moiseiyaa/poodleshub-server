import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const now = new Date();
  const posts = [
    {
      id: `blog_${Date.now()}_a`,
      title: 'Welcome to PuppyHub',
      slug: 'welcome-to-puppyhub',
      excerpt: 'Introducing PuppyHub — your best place for finding loving puppies.',
      content: '# Welcome\n\nThis is the first post. **PuppyHub** helps you find the perfect puppy!\n\n- Loving homes\n- Trusted breeders\n',
      tags: ['announcement','intro'],
      published: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: `blog_${Date.now()}_b`,
      title: 'Caring for your puppy',
      slug: 'caring-for-your-puppy',
      excerpt: 'Tips for first-time puppy owners.',
      content: '## Puppy Care\n\nRemember to schedule vet visits and socialization.',
      tags: ['care','tips'],
      published: true,
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const p of posts) {
    const exists = await prisma.blog.findUnique({ where: { slug: p.slug } });
    if (!exists) {
      await prisma.blog.create({ data: p });
      console.log('Inserted', p.slug);
    } else {
      console.log('Already exists', p.slug);
    }
  }
} catch (e) {
  console.error('Seed error', e);
} finally {
  await prisma.$disconnect();
}
