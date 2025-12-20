import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restorePosts() {
  try {
    // These were legitimate posts that got deleted
    const postsToRestore = [
      {
        id: 'post_wp_87472',
        title: 'Jill Whelan\'s Life Lessons From Hollywood\'s Greatest',
        slug: 'jill-whelan-life-lessons-hollywood',
        status: 'PUBLISHED'
      },
      {
        id: 'post_wp_87633',
        title: 'What Is a Minimum Viable Product? Learn to Test Your Core Product Ideas',
        slug: 'what-is-a-minimum-viable-product',
        status: 'PUBLISHED'
      },
      {
        id: 'post_wp_88376',
        title: 'Representing the Brightest Stars on the Biggest Stage',
        slug: 'smith-and-saint-representing-the-brightest-stars',
        status: 'PUBLISHED'
      }
    ];

    for (const post of postsToRestore) {
      const existing = await prisma.posts.findUnique({ where: { id: post.id } });
      if (\!existing) {
        console.log('Note: Post ' + post.id + ' needs to be reimported from WordPress');
      } else {
        console.log('Post ' + post.id + ' still exists');
      }
    }
    
    console.log('Check complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.\();
  }
}

restorePosts();
