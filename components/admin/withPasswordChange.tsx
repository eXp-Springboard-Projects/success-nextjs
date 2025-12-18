import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

/**
 * HOC to enforce password change for users with default passwords
 * Wraps admin pages to redirect users who haven't changed their default password
 */
export function withPasswordChange<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isCheckingPassword, setIsCheckingPassword] = useState(true);

    useEffect(() => {
      const checkPasswordStatus = async () => {
        // Don't check on the change-password page itself
        if (router.pathname === '/admin/change-password') {
          setIsCheckingPassword(false);
          return;
        }

        // Wait for session to load
        if (status === 'loading') {
          return;
        }

        // Not authenticated - will be handled by page-level auth
        if (!session) {
          setIsCheckingPassword(false);
          return;
        }

        try {
          // Check if user needs to change password
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();

            // If user hasn't changed default password, redirect
            if (!data.user.hasChangedDefaultPassword) {
router.push('/admin/change-password');
              return;
            }
          }

          setIsCheckingPassword(false);
        } catch (error) {
          setIsCheckingPassword(false);
        }
      };

      checkPasswordStatus();
    }, [router, session, status]);

    // Show loading state while checking
    if (isCheckingPassword) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f7fafc'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#718096' }}>Verifying credentials...</p>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
