import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Log when component mounts
  useEffect(() => {
    console.log('AdminLogin component mounted');
    console.log('React is working');

    // Test if signIn is available
    console.log('signIn function available:', typeof signIn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Login form submitted, starting authentication...');
    console.log('Email:', email, 'Password length:', password.length);
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, passwordLength: password.length });
      const result: any = await Promise.race([
        signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/admin',
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Login timeout - please check your connection')), 15000)
        )
      ]);

      console.log('Login result:', JSON.stringify(result, null, 2));

      if (result?.error) {
        console.error('Login error:', result.error);
        setError(`Login failed: ${result.error}`);
        setLoading(false);
      } else if (result?.ok) {
        console.log('Login successful! Result.ok =', result.ok);
        console.log('Result.url =', result.url);

        // NextAuth succeeded - redirect immediately
        if (result.url) {
          console.log('Redirecting to:', result.url);
          window.location.href = result.url;
        } else {
          console.log('No URL in result, redirecting to /admin');
          window.location.href = '/admin';
        }
      } else {
        console.error('Unexpected result:', result);
        setError('Login failed - unexpected response');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - SUCCESS</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.logo}>SUCCESS</h1>
          <h2 className={styles.title}>Admin Dashboard</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>{error}</div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#c41e3a', textDecoration: 'none', fontWeight: 'bold' }}>
                Register here
              </a>
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              <a href="/forgot-password" style={{ color: '#666', textDecoration: 'underline' }}>
                Forgot password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Force SSR to prevent NextRouter errors during build
export async function getServerSideProps() {
  return {
    props: {},
  };
}
