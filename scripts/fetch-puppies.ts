import { prisma } from '../src/lib/prisma.js';

async function fetchPuppies() {
  try {
    console.log('Fetching puppies from database...');
    
    const puppies = await prisma.puppy.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        breed: true,
        gender: true,
        birthDate: true,
        price: true,
        status: true,
        color: true,
        generation: true,
        vaccinations: true,
        notes: true,
        images: true,
        sireId: true,
        damId: true,
        createdAt: true,
        updatedAt: true,
        damImage: true,
      }
    });

    console.log(`Found ${puppies.length} puppies:`);
    console.log('='.repeat(80));
    
    puppies.forEach((puppy, index) => {
      console.log(`\n${index + 1}. ${puppy.name}`);
      console.log(`   ID: ${puppy.id}`);
      console.log(`   Breed: ${puppy.breed}`);
      console.log(`   Gender: ${puppy.gender}`);
      console.log(`   Status: ${puppy.status}`);
      console.log(`   Color: ${puppy.color}`);
      console.log(`   Price: $${puppy.price}`);
      console.log(`   Birth Date: ${puppy.birthDate}`);
      console.log(`   Images: ${puppy.images?.length || 0} images`);
      console.log(`   Created: ${puppy.createdAt}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Total puppies in database: ${puppies.length}`);

  } catch (error) {
    console.error('Error fetching puppies:', error);
    if (error.code === 'P1001') {
      console.error('\nDatabase connection error. Please check:');
      console.error('1. Database URL in .env file');
      console.error('2. Neon database status');
      console.error('3. Network connectivity');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fetchPuppies();
