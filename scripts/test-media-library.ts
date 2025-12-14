import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMediaLibrary() {
  console.log('🎨 Testing Media Library...\n');

  // 1. Check media count
  console.log('1️⃣ Checking media items...');
  const mediaCount = await prisma.media.count();
  console.log(`✅ Total media items: ${mediaCount}`);

  // 2. Get sample media
  if (mediaCount > 0) {
    console.log('\n2️⃣ Sample media items:');
    const sampleMedia = await prisma.media.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    sampleMedia.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.filename}`);
      console.log(`      Type: ${item.mimeType} | Size: ${(item.size / 1024).toFixed(2)}KB`);
      console.log(`      URL: ${item.url}`);
    });
  } else {
    console.log('\n⚠️  No media items in database yet.');
    console.log('   Upload files through the admin interface at /admin/media');
  }

  console.log('\n✅ Media library system ready!');
  console.log('\n📝 Test checklist:');
  console.log('   1. Login as editorial@success.com');
  console.log('   2. Navigate to /admin/media');
  console.log('   3. Upload an image file');
  console.log('   4. Verify image appears in grid');
  console.log('   5. Click image to view details');
  console.log('   6. Test "Copy URL" button');
  console.log('   7. Test "Delete" button');
}

testMediaLibrary()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
