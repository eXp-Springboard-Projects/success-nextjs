import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import EnhancedPostEditor from '@/components/admin/EnhancedPostEditor';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function NewPremiumContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading' || !mounted) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  // Render the enhanced post editor with premium content pre-selected
  return <EnhancedPostEditor />;
}

export const getServerSideProps = requireAdminAuth;
