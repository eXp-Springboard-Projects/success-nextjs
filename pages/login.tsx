import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from './Login.module.css';

export default function MemberLogin() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        // Wait a moment for session to update, then fetch it
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch updated session to check user role
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();

// Redirect based on user role
        const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'];
        if (staffRoles.includes(sessionData?.user?.role)) {
router.push('/admin');
        } else {
const callbackUrl = router.query.callbackUrl as string || '/dashboard';
          router.push(callbackUrl);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.loginBox}>
          {/* SUCCESS+ Logo */}
          <div className={styles.logo}>
            <h1>SUCCESS<span className={styles.plus}>+</span></h1>
            <p className={styles.tagline}>Member Login</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formFooter}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className={styles.signupSection}>
            <p>Not a member yet?</p>
            <Link href="/subscribe" className={styles.signupLink}>
              Join SUCCESS+ Today
            </Link>
          </div>

          {/* Claim Account Link */}
          <div className={styles.claimSection}>
            <p>Already a SUCCESS+ subscriber?</p>
            <Link href="/claim-account" className={styles.claimLink}>
              Claim Your Account →
            </Link>
          </div>

          {/* Benefits Reminder */}
          <div className={styles.benefits}>
            <h3>SUCCESS+ Member Benefits</h3>
            <ul>
              <li>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Unlimited access to premium articles
              </li>
              <li>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Exclusive video content
              </li>
              <li>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Digital magazine issues
              </li>
              <li>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Ad-free reading experience
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {/* Staff Login - Direct link to admin login page */}
          <div className={styles.staffSection}>
            <h3 className={styles.staffTitle}>Staff Member?</h3>
            <p className={styles.staffDescription}>
              If you're a SUCCESS Magazine staff member, use the staff login portal
            </p>
            <Link href="/admin/login" className={styles.staffLoginButton}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Force SSR for AWS Amplify deployment compatibility
export async function getServerSideProps() {
  return {
    props: {},
  };
}
