

const prisma = new PrismaClient();

async function testMedia() {
  try {
    console.log('Testing media table...');

    const count = await prisma.media.count();
    console.log(`✅ Media count: ${count}`);

    const media = await prisma.media.findMany({ take: 5 });
    console.log(`✅ Sample media:`, media);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMedia();
