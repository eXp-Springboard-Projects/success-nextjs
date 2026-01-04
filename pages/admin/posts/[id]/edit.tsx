import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EnhancedPostEditor from '../../../../components/admin/EnhancedPostEditor';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function EditPost() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <EnhancedPostEditor postId={id as string} />
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
