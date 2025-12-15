import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './trial.module.css';

export default function TrialSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/trial-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create trial account');
      }

      // Redirect to dashboard
      router.push('/dashboard?trial=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Start Your 7-Day FREE Trial - SUCCESS+</title>
        <meta
          name="description"
          content="Get unlimited access to premium SUCCESS content, courses, and resources. No credit card required."
        />
      </Head>

      <div className={styles.container}>
        <div className={styles.trialBox}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/" className={styles.logo}>
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
            <h1 className={styles.title}>Start Your 7-Day FREE Trial</h1>
            <p className={styles.subtitle}>
              Get full access to SUCCESS+ premium content. No credit card required.
            </p>
          </div>

          {/* Benefits */}
          <div className={styles.benefits}>
            <div className={styles.benefitItem}>
              <span className={styles.benefitIcon}>✓</span>
              <span>Unlimited access to premium articles</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitIcon}>✓</span>
              <span>Exclusive courses and resources</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitIcon}>✓</span>
              <span>Digital magazine library</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitIcon}>✓</span>
              <span>Live events and webinars</span>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitIcon}>✓</span>
              <span>Cancel anytime - no commitment</span>
            </div>
          </div>

          {/* Trial Badge */}
          <div className={styles.trialBadge}>
            <div className={styles.badgeIcon}>🎁</div>
            <div className={styles.badgeText}>
              <div className={styles.badgeDays}>7 Days FREE</div>
              <div className={styles.badgeSubtext}>No credit card required</div>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="John"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="john@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className={styles.input}
                placeholder="Minimum 8 characters"
              />
              <small className={styles.hint}>
                Must be at least 8 characters long
              </small>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Creating Your Account...' : 'Start My FREE Trial'}
            </button>

            <p className={styles.terms}>
              By signing up, you agree to our{' '}
              <Link href="/legal/terms">Terms of Service</Link> and{' '}
              <Link href="/legal/privacy">Privacy Policy</Link>
            </p>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p>
              Already have an account?{' '}
              <Link href="/signin">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Side Panel - Social Proof */}
        <div className={styles.sidePanel}>
          <div className={styles.testimonial}>
            <div className={styles.quote}>"</div>
            <p className={styles.testimonialText}>
              SUCCESS+ has transformed how I approach my business. The premium
              content and expert insights are worth every penny.
            </p>
            <div className={styles.testimonialAuthor}>
              <strong>Sarah Johnson</strong>
              <span>Entrepreneur & SUCCESS+ Member</span>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>50,000+</div>
              <div className={styles.statLabel}>Active Members</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1,000+</div>
              <div className={styles.statLabel}>Premium Articles</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>130 Years</div>
              <div className={styles.statLabel}>Of Excellence</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
