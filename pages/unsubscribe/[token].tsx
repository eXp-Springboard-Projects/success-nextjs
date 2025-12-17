import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from './Unsubscribe.module.css';

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    optInMarketing: true,
    optInNewsletter: true,
    optInTransactional: true,
  });
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPreferences();
    }
  }, [token]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/email/preferences/${token}`);
      if (res.ok) {
        const data = await res.json();
        setEmail(data.maskedEmail);
        setPreferences({
          optInMarketing: data.optInMarketing,
          optInNewsletter: data.optInNewsletter,
          optInTransactional: data.optInTransactional,
        });
        setUnsubscribeAll(data.unsubscribed);
      } else {
        setError('Invalid or expired link');
      }
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/email/preferences/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          unsubscribed: unsubscribeAll,
          unsubscribeReason: reason || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError('Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAllChange = (checked: boolean) => {
    setUnsubscribeAll(checked);
    if (checked) {
      setPreferences({
        optInMarketing: false,
        optInNewsletter: false,
        optInTransactional: false,
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.logo}>SUCCESS</h1>
        </div>
        <div className={styles.card}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Email Preferences Updated - SUCCESS Magazine</title>
        </Head>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.logo}>SUCCESS</h1>
          </div>
          <div className={styles.card}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Preferences Updated</h2>
            <p className={styles.successMessage}>
              Your email preferences have been successfully updated for {email}.
            </p>
            {unsubscribeAll && (
              <p className={styles.note}>
                You have been unsubscribed from all emails. You can update your preferences
                anytime using the link in any of our emails.
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Email Preferences - SUCCESS Magazine</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.logo}>SUCCESS</h1>
        </div>

        <div className={styles.card}>
          <h2 className={styles.title}>Email Preferences</h2>
          <p className={styles.subtitle}>Manage your email subscriptions for {email}</p>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Choose what you would like to receive:</h3>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={preferences.optInMarketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, optInMarketing: e.target.checked })
                  }
                  disabled={unsubscribeAll}
                />
                <span className={styles.checkboxLabel}>
                  <strong>Marketing Emails</strong>
                  <span className={styles.checkboxDescription}>
                    Special offers, promotions, and SUCCESS+ updates
                  </span>
                </span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={preferences.optInNewsletter}
                  onChange={(e) =>
                    setPreferences({ ...preferences, optInNewsletter: e.target.checked })
                  }
                  disabled={unsubscribeAll}
                />
                <span className={styles.checkboxLabel}>
                  <strong>Newsletter</strong>
                  <span className={styles.checkboxDescription}>
                    Weekly digest of our latest articles and content
                  </span>
                </span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={preferences.optInTransactional}
                  onChange={(e) =>
                    setPreferences({ ...preferences, optInTransactional: e.target.checked })
                  }
                  disabled={unsubscribeAll}
                />
                <span className={styles.checkboxLabel}>
                  <strong>Product Updates</strong>
                  <span className={styles.checkboxDescription}>
                    Important account and product notifications
                  </span>
                </span>
              </label>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.section}>
              <label className={styles.checkboxUnsubscribe}>
                <input
                  type="checkbox"
                  checked={unsubscribeAll}
                  onChange={(e) => handleUnsubscribeAllChange(e.target.checked)}
                />
                <span className={styles.checkboxLabel}>
                  <strong>Unsubscribe from all emails</strong>
                </span>
              </label>

              {unsubscribeAll && (
                <div className={styles.reasonSection}>
                  <label className={styles.reasonLabel}>
                    Help us improve (optional):
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={styles.reasonSelect}
                  >
                    <option value="">Select a reason...</option>
                    <option value="too_frequent">Emails are too frequent</option>
                    <option value="not_relevant">Content is not relevant to me</option>
                    <option value="never_signed_up">I never signed up for this</option>
                    <option value="spam">These emails are spam</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className={styles.submitButton}>
              {saving ? 'Updating...' : 'Update Preferences'}
            </button>
          </form>
        </div>

        <div className={styles.footer}>
          <p>&copy; {new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
