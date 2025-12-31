import { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authHeader}>
            <h1>Check Your Email</h1>
          </div>
          <div className={styles.successMessage}>
            <p>
              If an account exists with <strong>{email}</strong>, you will
              receive a password reset email shortly.
            </p>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#4a5568' }}>
              The reset link will expire in 1 hour.
            </p>
          </div>
          <Link
            href="/admin/login"
            className={styles.primaryButton}
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.authHeader}>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className={styles.authFooter}>
            Remember your password? <Link href="/admin/login">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Force SSR to prevent build errors on AWS Amplify
export async function getServerSideProps() {
  return {
    props: {},
  };
}
