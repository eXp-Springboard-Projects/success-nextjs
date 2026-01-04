import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EnhancedPostEditor from '../../../components/admin/EnhancedPostEditor';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function NewPost() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <EnhancedPostEditor />
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
