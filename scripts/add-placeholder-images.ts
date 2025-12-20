import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Unsplash placeholder images for different categories
const placeholderImages = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', // Team meeting
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop', // Success
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop', // Business
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop', // Office
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop', // Laptop
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop', // Meeting
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop', // Teamwork
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop', // Startup
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop', // Entrepreneur
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop', // Business person
];

async function addPlaceholderImages() {
  try {
    const postsWithoutImages = await prisma.posts.findMany({
      where: {
        status: 'PUBLISHED',
        featuredImage: null
      },
      select: {
        id: true,
        title: true
      }
    });

    console.log(`Found ${postsWithoutImages.length} posts without images`);

    let updated = 0;

    for (const post of postsWithoutImages) {
      const randomImage = placeholderImages[updated % placeholderImages.length];

      await prisma.posts.update({
        where: { id: post.id },
        data: { featuredImage: randomImage }
      });

      updated++;

      if (updated % 50 === 0) {
        console.log(`Updated ${updated} posts...`);
      }
    }

    console.log(`\n✅ Updated ${updated} posts with placeholder images`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPlaceholderImages();
