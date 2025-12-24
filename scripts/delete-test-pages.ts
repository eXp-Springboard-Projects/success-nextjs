

const prisma = new PrismaClient();

async function findAndDeleteTestPosts() {
  try {
    const testPosts = await prisma.posts.findMany({
      where: {
        title: {
          contains: 'test',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true
      }
    });

    console.log('Test posts found:', JSON.stringify(testPosts, null, 2));

    if (testPosts.length > 0) {
      const result = await prisma.posts.deleteMany({
        where: {
          title: {
            contains: 'test',
            mode: 'insensitive'
          }
        }
      });
      console.log('Deleted ' + result.count + ' test posts');
    } else {
      console.log('No test posts to delete');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.disconnect();
  }
}

findAndDeleteTestPosts();
