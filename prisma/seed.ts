import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create breeds
  const breeds = await Promise.all([
    prisma.breed.create({
      data: {
        name: 'Maltipoo',
        description: 'A cross between a Maltese and a Poodle',
        characteristics: 'Small, friendly, intelligent',
        averageSize: 'Small (5-15 lbs)',
        temperament: 'Affectionate, playful, intelligent',
      },
    }),
    prisma.breed.create({
      data: {
        name: 'Goldendoodle',
        description: 'A cross between a Golden Retriever and a Poodle',
        characteristics: 'Medium to large, friendly, energetic',
        averageSize: 'Medium to Large (30-90 lbs)',
        temperament: 'Friendly, intelligent, energetic',
      },
    }),
    prisma.breed.create({
      data: {
        name: 'Labradoodle',
        description: 'A cross between a Labrador Retriever and a Poodle',
        characteristics: 'Medium to large, intelligent, trainable',
        averageSize: 'Medium to Large (30-65 lbs)',
        temperament: 'Intelligent, friendly, trainable',
      },
    }),
    prisma.breed.create({
      data: {
        name: 'Bernedoodle',
        description: 'A cross between a Bernese Mountain Dog and a Poodle',
        characteristics: 'Medium to large, calm, loyal',
        averageSize: 'Medium to Large (50-90 lbs)',
        temperament: 'Calm, loyal, intelligent',
      },
    }),
  ]);

  console.log(`✅ Created ${breeds.length} breeds`);

  // Create puppies
  const puppies = await Promise.all([
    prisma.puppy.create({
      data: {
        name: 'Luna',
        breed: 'Maltipoo',
        gender: 'female',
        birthDate: new Date('2025-09-01'),
        price: 2600,
        status: 'available',
        color: 'apricot',
        generation: 'F1b',
        vaccinations: ['DHLPP', 'Rabies'],
        notes: 'Family raised, very playful and affectionate',
        images: ['/images/puppies/luna-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Max',
        breed: 'Goldendoodle',
        gender: 'male',
        birthDate: new Date('2025-08-15'),
        price: 2800,
        status: 'available',
        color: 'cream',
        generation: 'F1',
        vaccinations: ['DHLPP'],
        notes: 'Gentle temperament, great with kids',
        images: ['/images/puppies/max-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Bella',
        breed: 'Labradoodle',
        gender: 'female',
        birthDate: new Date('2025-08-20'),
        price: 2500,
        status: 'reserved',
        color: 'chocolate',
        generation: 'F1b',
        vaccinations: ['DHLPP', 'Bordetella'],
        notes: 'Smart and trainable, loves water',
        images: ['/images/puppies/bella-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Charlie',
        breed: 'Bernedoodle',
        gender: 'male',
        birthDate: new Date('2025-09-05'),
        price: 3200,
        status: 'available',
        color: 'tri-color',
        generation: 'F1',
        vaccinations: ['DHLPP'],
        notes: 'Calm and loyal, excellent family dog',
        images: ['/images/puppies/charlie-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Daisy',
        breed: 'Maltipoo',
        gender: 'female',
        birthDate: new Date('2025-09-01'),
        price: 2600,
        status: 'available',
        color: 'white',
        generation: 'F1b',
        vaccinations: ['DHLPP', 'Rabies'],
        notes: 'Sweet and cuddly, loves attention',
        images: ['/images/puppies/daisy-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Cooper',
        breed: 'Goldendoodle',
        gender: 'male',
        birthDate: new Date('2025-08-15'),
        price: 2800,
        status: 'available',
        color: 'golden',
        generation: 'F1',
        vaccinations: ['DHLPP'],
        notes: 'Energetic and friendly, loves to play',
        images: ['/images/puppies/cooper-1.jpg'],
      },
    }),
  ]);

  console.log(`✅ Created ${puppies.length} puppies`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
