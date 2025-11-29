import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create breeds (or get existing ones)
  const breedNames = ['Maltipoo', 'Goldendoodle', 'Labradoodle', 'Bernedoodle', 'Poodle'];
  const breeds = await Promise.all(
    breedNames.map(async (name) => {
      const existingBreed = await prisma.breed.findUnique({ where: { name } });
      if (existingBreed) return existingBreed;
      
      const breedData = {
        Maltipoo: {
          description: 'A cross between a Maltese and a Poodle',
          characteristics: 'Small, friendly, intelligent',
          averageSize: 'Small (5-15 lbs)',
          temperament: 'Affectionate, playful, intelligent',
        },
        Goldendoodle: {
          description: 'A cross between a Golden Retriever and a Poodle',
          characteristics: 'Medium to large, friendly, energetic',
          averageSize: 'Medium to Large (30-90 lbs)',
          temperament: 'Friendly, intelligent, energetic',
        },
        Labradoodle: {
          description: 'A cross between a Labrador Retriever and a Poodle',
          characteristics: 'Medium to large, intelligent, trainable',
          averageSize: 'Medium to Large (30-65 lbs)',
          temperament: 'Intelligent, friendly, trainable',
        },
        Bernedoodle: {
          description: 'A cross between a Bernese Mountain Dog and a Poodle',
          characteristics: 'Medium to large, calm, loyal',
          averageSize: 'Medium to Large (50-90 lbs)',
          temperament: 'Calm, loyal, intelligent',
        },
        Poodle: {
          description: 'Purebred Poodle - intelligent and versatile',
          characteristics: 'Very intelligent, hypoallergenic, elegant',
          averageSize: 'Toy (5-10 lbs), Mini (10-15 lbs), Standard (45-70 lbs)',
          temperament: 'Intelligent, proud, eager to please',
        },
      };
      
      return prisma.breed.create({
        data: { name, ...breedData[name] },
      });
    })
  );

  console.log(`✅ Created ${breeds.length} breeds`);

  // Create puppies
  const puppies = await Promise.all([
    prisma.puppy.create({
      data: {
        name: 'Sophie',
        breed: 'Poodle',
        gender: 'female',
        birthDate: new Date('2025-08-25'),
        price: 875,
        status: 'available',
        color: 'apricot',
        generation: 'Purebred',
        vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
        notes: 'Miniature Poodle, very intelligent and eager to learn. Excellent with children and other pets.',
        images: ['/images/puppies/sophie-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Oliver',
        breed: 'Poodle',
        gender: 'male',
        birthDate: new Date('2025-09-10'),
        price: 925,
        status: 'available',
        color: 'black',
        generation: 'Purebred',
        vaccinations: ['DHLPP', 'Rabies'],
        notes: 'Standard Poodle, confident and athletic. Great for active families who enjoy outdoor activities.',
        images: ['/images/puppies/oliver-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Lily',
        breed: 'Poodle',
        gender: 'female',
        birthDate: new Date('2025-08-30'),
        price: 799,
        status: 'available',
        color: 'white',
        generation: 'Purebred',
        vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
        notes: 'Toy Poodle, affectionate and playful. Perfect companion for apartment living or smaller homes.',
        images: ['/images/puppies/lily-1.jpg'],
      },
    }),
    prisma.puppy.create({
      data: {
        name: 'Luna',
        breed: 'Maltipoo',
        gender: 'female',
        birthDate: new Date('2025-09-01'),
        price: 825,
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
        price: 875,
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
        price: 699,
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
        price: 975,
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
        price: 825,
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
        price: 875,
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

  // Create admin user (if not exists)
  const adminEmail = 'admin@puppyhubusa.com';
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const plainPassword = 'password123';
    const hashed = await bcrypt.hash(plainPassword, 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password: hashed,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      }
    });
    console.log(`👤 Admin Created: ${adminEmail} / ${plainPassword}`);
  } else {
    console.log(`👤 Admin already exists: ${adminEmail}`);
  }

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
