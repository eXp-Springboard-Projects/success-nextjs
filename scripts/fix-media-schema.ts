/**
 * Fix Media Schema - Add relation to users table
 *
 * The media table has uploadedBy field but no relation defined
 * This adds the relation properly
 */



const prisma = new PrismaClient();

async function fixMediaSchema() {
  console.log('\n🔧 Fixing Media Schema');
  console.log('======================\n');

  try {
    // Test if we can query media with user relation
    console.log('Testing media queries...');

    const mediaCount = await prisma.media.count();
    console.log(`✅ Media table accessible: ${mediaCount} items`);

    // Note: The relation needs to be added in schema.prisma, not via script
    // This script just verifies the current state

    const media = await prisma.media.findFirst();
    if (media) {
      console.log('✅ Sample media item:', {
        id: media.id,
        filename: media.filename,
        uploadedBy: media.uploadedBy,
      });

      // Check if the user exists
      const user = await prisma.users.findUnique({
        where: { id: media.uploadedBy }
      });

      if (user) {
        console.log(`✅ User exists: ${user.name} (${user.email})`);
      } else {
        console.warn(`⚠️  User not found for uploadedBy: ${media.uploadedBy}`);
      }
    }

    console.log('\n📝 To fix the schema:');
    console.log('1. Add relation in prisma/schema.prisma:');
    console.log(`
model media {
  id         String   @id
  filename   String
  url        String
  mimeType   String
  size       Int
  width      Int?
  height     Int?
  alt        String?
  uploadedBy String
  users      users    @relation(fields: [uploadedBy], references: [id])
  createdAt  DateTime @default(now())
  caption    String?
}

model users {
  ...existing fields...
  media      media[]  // Add this line
}
`);

    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMediaSchema();
