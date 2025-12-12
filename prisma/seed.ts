import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create breeds (or get existing ones)
  const breedNames = ['Maltipoo', 'Goldendoodle', 'Labradoodle', 'Bernedoodle', 'Poodle', 'Border Collie', 'Cardigan Welsh Corgi'];
  const breeds = await Promise.all(
    breedNames.map(async (name) => {
      const existingBreed = await prisma.breed.findUnique({ where: { name } });
      if (existingBreed) return existingBreed;
      
      const breedData: Record<string, {
        description: string;
        characteristics: string;
        averageSize: string;
        temperament: string;
      }> = {
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
        'Border Collie': {
          description: 'Highly intelligent herding dog',
          characteristics: 'Energetic, intelligent, work-oriented',
          averageSize: '30-45 lbs',
          temperament: 'Energetic, intelligent, responsive',
        },
        'Cardigan Welsh Corgi': {
          description: 'One of the oldest herding breeds, known for their long tail and fox-like expression',
          characteristics: 'Alert, affectionate, intelligent',
          averageSize: '25-38 lbs',
          temperament: 'Loyal, affectionate, intelligent, active',
        },
      };
      
      return prisma.breed.create({
        data: { name, ...breedData[name] },
      });
    })
  );

  console.log(`✅ Created ${breeds.length} breeds`);

  // Puppy data to seed
  const puppyData = [
    {
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
      damImage: '/images/parents/poodle-dam-1.jpg',
    },
    {
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
      damImage: '/images/parents/poodle-dam-2.jpg',
    },
    {
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
      damImage: '/images/parents/poodle-dam-3.jpg',
    },
    {
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
      damImage: '/images/parents/maltipoo-dam-1.jpg',
    },
    {
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
      damImage: '/images/parents/goldendoodle-dam-1.jpg',
    },
    {
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
      damImage: '/images/parents/labradoodle-dam-1.jpg',
    },
    {
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
      damImage: '/images/parents/bernedoodle-dam-1.jpg',
    },
    {
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
      damImage: '/images/parents/maltipoo-dam-2.jpg',
    },
    {
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
      damImage: '/images/parents/goldendoodle-dam-1.jpg',
    },
    {
      name: 'Princess',
      breed: 'Maltese',
      gender: 'female',
      birthDate: new Date('2025-09-05'),
      price: 899,
      status: 'available',
      color: 'white',
      generation: 'Purebred',
      vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
      notes: 'Elegant and graceful, loves to be pampered. Perfect lap dog with a sweet, gentle personality.',
      images: [
        '/images/puppies/princess-1.jpg',
        '/images/puppies/princess-2.jpg',
        '/images/puppies/princess-3.png'
      ],
      damImage: '/images/parents/maltese-dam-1.jpg',
    },
    {
      name: 'Bentley',
      breed: 'Maltese',
      gender: 'male',
      birthDate: new Date('2025-08-28'),
      price: 925,
      status: 'available',
      color: 'white',
      generation: 'Purebred',
      vaccinations: ['DHLPP', 'Rabies'],
      notes: 'Playful and energetic, loves attention. Great with children and makes an excellent family companion.',
      images: [
        '/images/puppies/bentley-1.jpg',
        '/images/puppies/bentley-2.jpg'
      ],
      damImage: '/images/parents/maltese-dam-2.jpg',
    },
    {
      name: 'Angel',
      breed: 'Labradoodle',
      gender: 'female',
      birthDate: new Date('2025-09-10'),
      price: 845,
      status: 'available',
      color: 'cream',
      generation: 'F1b',
      vaccinations: ['DHLPP', 'Bordetella'],
      notes: 'Gentle Labradoodle who loves families and settles quickly in new homes.',
      images: [
        '/images/puppies/angel-1.jpg',
        '/images/puppies/angel-2.jpg',
        '/images/puppies/angel-3.jpg'
      ],
      damImage: '/images/parents/labradoodle-dam-1.jpg',
    },
    {
      name: 'Ace',
      breed: 'Border Collie',
      gender: 'male',
      birthDate: new Date('2025-08-22'),
      price: 895,
      status: 'available',
      color: 'black and white',
      generation: 'Purebred',
      vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
      notes: 'Exceptionally intelligent and energetic Border Collie with strong herding instincts. Perfect for active families who can provide plenty of exercise and mental stimulation. Excels at agility training and learns commands quickly.',
      images: [
        '/images/puppies/ace-1.jpg',
        '/images/puppies/ace-2.jpg',
        '/images/puppies/ace-3.jpg'
      ],
      damImage: '/images/parents/border-collie-dam-1.jpg',
    },
    {
      name: 'Jasper & Lizzy',
      breed: 'Poodle',
      gender: 'pair',
      birthDate: new Date('2025-09-15'),
      price: 3300,
      status: 'available',
      color: 'black & brown',
      generation: 'Purebred',
      vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
      notes: 'Jasper and Lizzy are bonded siblings who must be adopted together. They are inseparable best friends who bring double the love and joy to their forever home.',
      images: ['/images/puppies/jasper-lizzy-1.jpg'],
      damImage: '/images/parents/poodle-dam-1.jpg',
    },
    {
      name: 'Terry',
      breed: 'Cardigan Welsh Corgi',
      gender: 'male',
      birthDate: new Date('2025-09-20'),
      price: 1800,
      status: 'available',
      color: 'black & white',
      generation: 'Purebred',
      vaccinations: ['DHLPP', 'Rabies', 'Bordetella'],
      notes: 'Meet Terry, an adorable Cardigan Welsh Corgi puppy with classic panda markings. He has a playful, alert, and affectionate personality, and is extremely intelligent. Terry loves cuddles and enjoys being around people. Perfect for families or first-time pet parents. He is already showing signs of being smart, easy to train, and very affectionate. He enjoys toys, cozy beds, and being part of household activities.',
      images: [
        '/images/puppies/terry-1.jpg',
        '/images/puppies/terry-2.jpg',
        '/images/puppies/terry-3.jpg'
      ],
      damImage: '/images/parents/corgi-dam-1.jpg',
    },
    ];

  // Create puppies only if they don't already exist (check by name + breed + birthDate)
  const createdPuppies = [];
  const skippedPuppies = [];

  for (const data of puppyData) {
    // Check if puppy already exists
    const existing = await prisma.puppy.findFirst({
      where: {
        name: data.name,
        breed: data.breed,
        birthDate: data.birthDate,
      },
    });

    if (existing) {
      skippedPuppies.push(`${data.name} (${data.breed})`);
      continue;
    }

    const puppy = await prisma.puppy.create({ data });
    createdPuppies.push(puppy);
  }

  if (createdPuppies.length > 0) {
    console.log(`✅ Created ${createdPuppies.length} new puppies`);
  }
  if (skippedPuppies.length > 0) {
    console.log(`⏭️  Skipped ${skippedPuppies.length} existing puppies: ${skippedPuppies.join(', ')}`);
  }

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
