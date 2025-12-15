import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import styles from './claim-account.module.css';

export default function ClaimAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/claim-account/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send claim link');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <Head>
          <title>Check Your Email | SUCCESS+</title>
        </Head>

        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>✉️</div>
            <h1>Check Your Email</h1>
            <p className={styles.description}>
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className={styles.instructions}>
              Click the link in the email to claim your account and set your password.
              The link will expire in 24 hours.
            </p>
            <p className={styles.note}>
              Don't see the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setSuccess(false);
                  setLoading(false);
                }}
                className={styles.linkButton}
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Claim Your Account | SUCCESS+</title>
        <meta name="description" content="Existing SUCCESS+ members can claim their online account" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Claim Your SUCCESS+ Account</h1>
          <p className={styles.description}>
            Already a SUCCESS+ subscriber? Claim your online account to access exclusive member content.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email linked to your subscription"
                className={styles.input}
                required
                disabled={loading}
              />
              <p className={styles.hint}>
                Use the email address associated with your SUCCESS+ subscription
              </p>
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
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Claim Link'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.alternateActions}>
            <p>Not a member yet?</p>
            <button
              onClick={() => router.push('/success-plus')}
              className={styles.secondaryButton}
            >
              View Plans & Pricing
            </button>
          </div>

          <div className={styles.help}>
            <h3>Need Help?</h3>
            <ul>
              <li>Make sure you use the email address you used when subscribing</li>
              <li>If you subscribed through PayKickstart, Stripe, or our website, you should have received confirmation emails</li>
              <li>
                Still having trouble?{' '}
                <a href="/contact">Contact support</a>
              </li>
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
