import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import VisualPageBuilder from '../../components/admin/VisualPageBuilder';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function VisualBuilderDemo() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleSave = async (blocks: any[]) => {
    console.log('Saving blocks:', blocks);
    // Here you would save to your database
    alert('Page saved! (Demo mode - check console for data)');
  };

  return (
    <VisualPageBuilder
      pageId="demo"
      initialContent={[]}
      onSave={handleSave}
    />
  );
}

export const getServerSideProps = requireAdminAuth;
