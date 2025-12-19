import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating team_members table...');

  // The table will be created by Prisma db push
  // This script will seed initial data from the About page

  const teamMembers = [
    {
      name: 'Glenn Sanford',
      title: 'Managing Director and Publisher',
      bio: 'Glenn Sanford is reimagining SUCCESS as a next-gen platform for personal growth, leadership, and high performance. By fusing its legacy with modern innovation, he is turning SUCCESS into a catalyst for transformation where timeless principles meet the tools of the AI era.',
      image: 'https://www.success.com/wp-content/uploads/2025/10/GlennSquare.png',
      linkedIn: 'https://www.linkedin.com/in/glenndsanford/',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Kerrie Lee Brown',
      title: 'Chief Content Officer & Editor-in-Chief',
      bio: 'Kerrie Lee Brown is an award-winning journalist, speaker, and wellness advocate with 30 years of experience in media and communications. She has contributed works to over 150 magazines globally and interviewed top names in Hollywood and business. Kerrie is passionate about mentoring others, promoting authentic leadership, and inspiring creative teams.',
      image: 'https://www.success.com/wp-content/uploads/2025/10/kerrielee2_square_no_blackbar.jpg',
      linkedIn: 'https://www.linkedin.com/in/kerrieleebrown/',
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Courtland Warren',
      title: 'Founding Faculty & Program Lead, SUCCESS Coaching',
      bio: 'A global strategist and transformational coach, Courtland Warren blends behavioral science with human potential. As the founding faculty of SUCCESS Coaching, he guides leaders through identity-first transformation helping them think deeper, lead stronger, and live with purpose.',
      image: 'https://www.success.com/wp-content/uploads/2025/10/courtland-crop.png',
      linkedIn: 'https://www.linkedin.com/in/courtlandwarren/',
      displayOrder: 3,
      isActive: true,
    },
    {
      name: 'Rachel Nead',
      title: 'Vice President of Innovations',
      bio: 'Rachel Nead brings a fresh perspective to innovation, leveraging emerging technologies and creative strategies to advance SUCCESS mission. Her leadership drives the development of cutting-edge platforms and solutions that empower individuals to achieve their full potential.',
      image: 'https://www.success.com/wp-content/uploads/2025/11/Rachel2.png',
      linkedIn: '',
      displayOrder: 4,
      isActive: true,
    },
  ];

  console.log('Seeding team members...');

  for (const member of teamMembers) {
    await prisma.team_members.create({
      data: member,
    });
    console.log(`✓ Added ${member.name}`);
  }

  console.log('\n✅ Team members table created and seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
