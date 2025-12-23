import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { DEFAULT_PASSWORD } from '../lib/auth-validation';

export default function RegisterPage() {
  const router = useRouter();
  const { code: urlCode } = router.query;

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'EDITOR',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInviteField, setShowInviteField] = useState(false);

  // Pre-fill invite code from URL
  useEffect(() => {
    if (urlCode && typeof urlCode === 'string') {
      setFormData(prev => ({ ...prev, inviteCode: urlCode }));
      setShowInviteField(true);
    }
  }, [urlCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.email || !formData.name) {
      setError('Email and name are required');
      return;
    }

    // Validate password
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if email is @success.com OR rachel.nead@exprealty.net OR invite code is provided
    const isSuccessEmail = formData.email.endsWith('@success.com');
    const isRachelNead = formData.email.toLowerCase() === 'rachel.nead@exprealty.net';
    const hasInviteCode = formData.inviteCode.trim().length > 0;

    if (!isSuccessEmail && !isRachelNead && !hasInviteCode) {
      setError('Either use a @success.com email or provide a valid invite code');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError('Server error - please try again later');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorMessage = data.error || 'Failed to create account';
        const details = data.details ? ` Details: ${data.details}` : '';
        setError(errorMessage + details);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authHeader}>
            <h1>Account Created!</h1>
          </div>
          <div className={styles.successMessage}>
            <p><strong>Your SUCCESS Magazine staff account has been created.</strong></p>
            <p style={{ marginTop: '12px' }}>
              <strong>Login Credentials:</strong><br />
              Email: {formData.email}<br />
              Password: Use the password you created
            </p>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#22543d' }}>
              Redirecting to login page...
            </p>
          </div>
          <Link href="/admin/login" className={styles.primaryButton} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '20px' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.authHeader}>
          <h1>Staff Registration</h1>
          <p>SUCCESS Magazine Staff Portal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">SUCCESS Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.name@success.com"
              disabled={loading}
              autoFocus
            />
            <small className={styles.helpText}>
              Must be a @success.com email address
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              disabled={loading}
              minLength={8}
            />
            <small className={styles.helpText}>
              At least 8 characters
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              disabled={loading}
            />
          </div>

          {!formData.email.endsWith('@success.com') && (
            <div className={styles.formGroup}>
              <label htmlFor="inviteCode">
                Invite Code {!showInviteField && <button type="button" onClick={() => setShowInviteField(true)} style={{ fontSize: '12px', marginLeft: '8px', textDecoration: 'underline', background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}>Have a code?</button>}
              </label>
              {showInviteField && (
                <>
                  <input
                    type="text"
                    id="inviteCode"
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                    placeholder="SUCCESS-XXXX-XXXX-XXXX"
                    disabled={loading}
                  />
                  <small className={styles.helpText}>
                    Non-@success.com emails require an invite code
                  </small>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className={styles.authFooter}>
            Already have an account? <Link href="/admin/login">Login here</Link>
          </div>
        </form>

      </div>
    </div>
  );
}

// Force SSR for AWS Amplify deployment compatibility
export async function getServerSideProps() {
  return {
    props: {},
  };
}
