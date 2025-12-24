

const prisma = new PrismaClient();

async function checkPosts() {
  try {
    const posts = await prisma.posts.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null }
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true
      }
    });

    console.log('Sample posts:', JSON.stringify(posts, null, 2));

    const totalWithImages = await prisma.posts.count({
      where: {
        status: 'PUBLISHED',
        featuredImage: { not: null }
      }
    });

    console.log('Total published posts with images:', totalWithImages);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();
