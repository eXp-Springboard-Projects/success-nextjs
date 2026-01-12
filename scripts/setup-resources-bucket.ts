import { supabaseAdmin } from '../lib/supabase';

async function setupResourcesBucket() {
  const supabase = supabaseAdmin();

  console.log('Checking for resources bucket...');

  // List all buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  console.log('Existing buckets:', buckets?.map(b => b.name).join(', ') || 'none');

  // Check if resources bucket exists
  const resourcesBucket = buckets?.find(b => b.name === 'resources');

  if (resourcesBucket) {
    console.log('✓ Resources bucket already exists');
    return;
  }

  console.log('Creating resources bucket...');

  // Create the resources bucket
  const { data, error } = await supabase.storage.createBucket('resources', {
    public: true, // Make files publicly accessible
    fileSizeLimit: 52428800, // 50MB in bytes
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/quicktime',
    ],
  });

  if (error) {
    console.error('Error creating bucket:', error);
    return;
  }

  console.log('✓ Resources bucket created successfully!');
  console.log('Bucket details:', data);
}

setupResourcesBucket()
  .then(() => {
    console.log('\nSetup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
