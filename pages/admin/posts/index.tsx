import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import PostsListWithFilters from '../../../components/admin/PostsListWithFilters';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function AdminPosts() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PostsListWithFilters />
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
