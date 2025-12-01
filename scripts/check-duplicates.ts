import { PrismaClient, Puppy } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllPuppies() {
  return prisma.puppy.findMany({ orderBy: { createdAt: 'desc' } });
}

function groupByKey<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFn(item);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  });
  return map;
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

async function removeDuplicates() {
  console.log('🧹 Removing duplicate puppies...\n');

  const allPuppies = await getAllPuppies();
  console.log(`Total puppies before cleanup: ${allPuppies.length}\n`);

  // Group by exact identity
  const groups = groupByKey(allPuppies, (p) =>
    [
      p.name.toLowerCase(),
      p.breed.toLowerCase(),
      formatDate(p.birthDate),
      p.color.toLowerCase(),
    ].join('|'),
  );

  const deletions: string[] = [];
  groups.forEach((puppies) => {
    if (puppies.length <= 1) return;

    // Keep the oldest entry (first created), delete the rest
    const sorted = puppies.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const keep = sorted[0];
    const remove = sorted.slice(1);

    remove.forEach((puppy) => deletions.push(puppy.id));

    console.log(
      `Keeping ${keep.id} (${keep.name} - ${keep.breed}), deleting ${remove.length} duplicates`,
    );
  });

  if (deletions.length === 0) {
    console.log('✅ No duplicates to remove.\n');
  } else {
    console.log(`Deleting ${deletions.length} duplicate entries...`);
    await prisma.puppy.deleteMany({
      where: { id: { in: deletions } },
    });
    console.log('✅ Duplicate entries removed.\n');
  }

  const remaining = await getAllPuppies();
  console.log(`Total puppies after cleanup: ${remaining.length}\n`);
}

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate puppies...\n');

  const allPuppies = await getAllPuppies();
  console.log(`Total puppies in database: ${allPuppies.length}\n`);

  const nameBreedMap = groupByKey(allPuppies, (puppy) =>
    `${puppy.name.toLowerCase()}-${puppy.breed.toLowerCase()}`,
  );

  const duplicates = Array.from(nameBreedMap.entries()).filter(
    ([, puppies]) => puppies.length > 1,
  );

  if (duplicates.length > 0) {
    console.log(`❌ Found ${duplicates.length} duplicate name+breed combinations:\n`);
    duplicates.forEach(([key, puppies]) => {
      console.log(`  "${key}" appears ${puppies.length} times:`);
      puppies.forEach((p) =>
        console.log(
          `    - ID: ${p.id}, Name: ${p.name}, Breed: ${p.breed}, Status: ${p.status}, Created: ${p.createdAt}`,
        ),
      );
      console.log('');
    });
  } else {
    console.log('✅ No duplicates found by name+breed combination\n');
  }

  const exactMap = groupByKey(allPuppies, (puppy) =>
    [
      puppy.name.toLowerCase(),
      puppy.breed.toLowerCase(),
      formatDate(puppy.birthDate),
      puppy.color.toLowerCase(),
    ].join('|'),
  );

  const exactDuplicates = Array.from(exactMap.values()).filter(
    (puppies) => puppies.length > 1,
  );

  if (exactDuplicates.length > 0) {
    console.log(`❌ Found ${exactDuplicates.length} exact duplicates:\n`);
    exactDuplicates.forEach((puppies) => {
      const first = puppies[0];
      console.log(
        `  "${first.name} - ${first.breed}" (${formatDate(first.birthDate)}, ${first.color}):`,
      );
      puppies.forEach((p) =>
        console.log(`    - ID: ${p.id}, Status: ${p.status}, Created: ${p.createdAt}`),
      );
      console.log('');
    });
  } else {
    console.log('✅ No exact duplicates found\n');
  }

  console.log('📊 Summary by breed:');
  const breedCounts = groupByKey(allPuppies, (p) => p.breed);
  breedCounts.forEach((puppies, breed) => console.log(`  ${breed}: ${puppies.length} puppies`));

  console.log('\n📊 Summary by status:');
  const statusCounts = groupByKey(allPuppies, (p) => p.status);
  statusCounts.forEach((puppies, status) => console.log(`  ${status}: ${puppies.length} puppies`));

  console.log('');
}

async function main() {
  await removeDuplicates();
  await checkDuplicates();
}

main()
  .catch((e) => {
    console.error('❌ Error during duplicate cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

