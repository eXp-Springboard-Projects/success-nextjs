import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Department } from '../types';

interface WithDepartmentAccessOptions {
  department: Department;
  redirectTo?: string;
}

/**
 * Higher-Order Component to protect department-specific pages
 * Usage: export default withDepartmentAccess(YourComponent, { department: 'EDITORIAL' })
 */
export function withDepartmentAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: WithDepartmentAccessOptions
) {
  return function ProtectedComponent(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      async function checkAccess() {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
          router.push(options.redirectTo || '/admin/login');
          return;
        }

        if (session?.user?.id) {
          try {
            const res = await fetch(
              `/api/admin/departments/check-access?department=${options.department}`
            );

            if (res.ok) {
              const data = await res.json();
              if (data.hasAccess) {
                setHasAccess(true);
              } else {
                // No access - redirect to admin home or first available department
                router.push('/admin');
              }
            } else {
              router.push('/admin');
            }
          } catch (error) {
            router.push('/admin');
          } finally {
            setChecking(false);
          }
        }
      }

      checkAccess();
    }, [session, status, router]);

    if (status === 'loading' || checking) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#666',
          }}
        >
          Loading...
        </div>
      );
    }

    if (!hasAccess) {
      return null;
    }

    return <Component {...props} />;
  };
}
