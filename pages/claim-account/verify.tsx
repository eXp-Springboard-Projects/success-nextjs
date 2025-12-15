import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import styles from '../claim-account.module.css';

export default function VerifyClaimPage() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (claimToken: string) => {
    try {
      const res = await fetch('/api/claim-account/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: claimToken }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setTokenValid(true);
        setEmail(data.email);
      } else {
        setError(data.error || 'Invalid or expired claim link');
      }
    } catch (err) {
      setError('Failed to verify claim link');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/claim-account/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token as string,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim account');
      }

      // Auto sign in after account creation
      const signInResult = await signIn('credentials', {
        email: data.email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/success-plus/welcome');
      } else {
        // Account created but auto-login failed, redirect to login
        router.push('/login?message=Account created! Please sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>⏳</div>
            <h1>Verifying Your Link...</h1>
            <p className={styles.description}>Please wait while we verify your claim link.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tokenValid || error) {
    return (
      <Layout>
        <Head>
          <title>Invalid Link | SUCCESS+</title>
        </Head>

        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>❌</div>
            <h1>Invalid or Expired Link</h1>
            <p className={styles.description}>
              {error || 'This claim link is invalid or has expired.'}
            </p>
            <button
              onClick={() => router.push('/claim-account')}
              className={styles.submitButton}
            >
              Request a New Link
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Set Your Password | SUCCESS+</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Set Your Password</h1>
          <p className={styles.description}>
            Creating account for <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className={styles.input}
                required
                minLength={8}
                disabled={loading}
              />
              <p className={styles.hint}>Minimum 8 characters</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={styles.input}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? 'Creating Account...' : 'Complete Setup'}
            </button>
          </form>

          <div className={styles.help}>
            <h3>What happens next?</h3>
            <ul>
              <li>Your account will be linked to your SUCCESS+ subscription</li>
              <li>You'll get instant access to all member benefits</li>
              <li>You can manage your subscription and preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Force SSR
export async function getServerSideProps() {
  return {
    props: {},
  };
}
