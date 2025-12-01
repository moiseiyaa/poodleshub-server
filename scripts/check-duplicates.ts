import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate puppies...\n');

  // Get all puppies
  const allPuppies = await prisma.puppy.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total puppies in database: ${allPuppies.length}\n`);

  // Check for duplicates by name + breed combination
  const nameBreedMap = new Map<string, any[]>();
  
  allPuppies.forEach(puppy => {
    const key = `${puppy.name.toLowerCase()}-${puppy.breed.toLowerCase()}`;
    if (!nameBreedMap.has(key)) {
      nameBreedMap.set(key, []);
    }
    nameBreedMap.get(key)!.push(puppy);
  });

  // Find duplicates
  const duplicates: Array<{ key: string; puppies: any[] }> = [];
  nameBreedMap.forEach((puppies, key) => {
    if (puppies.length > 1) {
      duplicates.push({ key, puppies });
    }
  });

  if (duplicates.length > 0) {
    console.log(`❌ Found ${duplicates.length} duplicate name+breed combinations:\n`);
    duplicates.forEach(({ key, puppies }) => {
      console.log(`  "${key}" appears ${puppies.length} times:`);
      puppies.forEach(p => {
        console.log(`    - ID: ${p.id}, Name: ${p.name}, Breed: ${p.breed}, Status: ${p.status}, Created: ${p.createdAt}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ No duplicates found by name+breed combination\n');
  }

  // Check for exact duplicates (same name, breed, birthDate, color)
  const exactDuplicates: Array<{ puppies: any[] }> = [];
  const exactMap = new Map<string, any[]>();
  
  allPuppies.forEach(puppy => {
    const key = `${puppy.name.toLowerCase()}-${puppy.breed.toLowerCase()}-${puppy.birthDate.toISOString()}-${puppy.color.toLowerCase()}`;
    if (!exactMap.has(key)) {
      exactMap.set(key, []);
    }
    exactMap.get(key)!.push(puppy);
  });

  exactMap.forEach((puppies, key) => {
    if (puppies.length > 1) {
      exactDuplicates.push({ puppies });
    }
  });

  if (exactDuplicates.length > 0) {
    console.log(`❌ Found ${exactDuplicates.length} exact duplicates (same name, breed, birthDate, color):\n`);
    exactDuplicates.forEach(({ puppies }) => {
      const first = puppies[0];
      console.log(`  "${first.name} - ${first.breed}" (${first.birthDate.toISOString().split('T')[0]}, ${first.color}):`);
      puppies.forEach(p => {
        console.log(`    - ID: ${p.id}, Status: ${p.status}, Created: ${p.createdAt}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ No exact duplicates found\n');
  }

  // Summary by breed
  console.log('📊 Summary by breed:');
  const breedCounts = new Map<string, number>();
  allPuppies.forEach(p => {
    breedCounts.set(p.breed, (breedCounts.get(p.breed) || 0) + 1);
  });
  
  breedCounts.forEach((count, breed) => {
    console.log(`  ${breed}: ${count} puppies`);
  });

  // Summary by status
  console.log('\n📊 Summary by status:');
  const statusCounts = new Map<string, number>();
  allPuppies.forEach(p => {
    statusCounts.set(p.status, (statusCounts.get(p.status) || 0) + 1);
  });
  
  statusCounts.forEach((count, status) => {
    console.log(`  ${status}: ${count} puppies`);
  });

  await prisma.$disconnect();
}

checkDuplicates()
  .catch((e) => {
    console.error('❌ Error checking duplicates:', e);
    process.exit(1);
  });

