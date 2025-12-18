/**
 * Higher-Order Component for Page Permission Protection
 * Wraps admin pages to enforce access control based on permissions system
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, ComponentType } from 'react';

interface PermissionCheckResult {
  allowed: boolean;
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  reason?: string;
}

interface WithPagePermissionProps {
  permissions?: PermissionCheckResult;
}

/**
 * HOC to protect pages with permission checks
 *
 * Usage:
 * export default withPagePermission(MyPage, '/admin/posts');
 */
export function withPagePermission<P extends object>(
  Component: ComponentType<P & WithPagePermissionProps>,
  pagePath: string
) {
  return function ProtectedPage(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [permissions, setPermissions] = useState<PermissionCheckResult | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      async function checkPermission() {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
          router.push('/admin/login');
          return;
        }

        if (!session?.user?.id) {
          router.push('/admin/login');
          return;
        }

        try {
          const res = await fetch('/api/admin/permissions/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pagePath }),
          });

          if (!res.ok) {
            throw new Error('Failed to check permissions');
          }

          const result: PermissionCheckResult = await res.json();

          if (!result.allowed) {
            // Redirect to admin dashboard with error message
            router.push('/admin?error=access_denied');
            return;
          }

          setPermissions(result);
        } catch (error) {
          router.push('/admin?error=permission_check_failed');
        } finally {
          setChecking(false);
        }
      }

      checkPermission();
    }, [status, session, router]);

    // Show loading while checking
    if (status === 'loading' || checking) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#666',
          fontSize: '1.125rem',
        }}>
          Checking permissions...
        </div>
      );
    }

    // Don't render until we have permissions
    if (!permissions) {
      return null;
    }

    // Render the component with permissions passed as props
    return <Component {...props} permissions={permissions} />;
  };
}

/**
 * Hook to access page permissions in a component
 */
export function usePagePermissions() {
  const [permissions, setPermissions] = useState<PermissionCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPermission = async (pagePath: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/permissions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath }),
      });

      if (!res.ok) {
        throw new Error('Failed to check permissions');
      }

      const result: PermissionCheckResult = await res.json();
      setPermissions(result);
      return result;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    checkPermission,
  };
}
