import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    optInMarketing: true,
    optInTransactional: true,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...preferences,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setEmail(data.email);
      } else {
        setError(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Invalid unsubscribe link</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Head>
          <title>Email Preferences Updated - SUCCESS Magazine</title>
        </Head>
        <div style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Preferences Updated</h1>
            <p style={{ color: '#6b7280' }}>Your email preferences have been updated for {email}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
              Return to SUCCESS Magazine →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1rem' }}>
      <Head>
        <title>Manage Email Preferences - SUCCESS Magazine</title>
      </Head>
      <div style={{ maxWidth: '500px', width: '100%', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Manage Email Preferences</h1>
          <p style={{ color: '#6b7280' }}>Choose which emails you'd like to receive from SUCCESS Magazine</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={preferences.optInMarketing}
                onChange={(e) => setPreferences({ ...preferences, optInMarketing: e.target.checked })}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>Marketing Emails</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Newsletters, product updates, and promotional content</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.optInTransactional}
                onChange={(e) => setPreferences({ ...preferences, optInTransactional: e.target.checked })}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>Transactional Emails</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Account updates, order confirmations, and important notifications</div>
              </div>
            </label>
          </div>

          {!preferences.optInMarketing && !preferences.optInTransactional && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Help us improve (optional)
              </label>
              <select
                value={preferences.reason}
                onChange={(e) => setPreferences({ ...preferences, reason: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              >
                <option value="">Why are you unsubscribing?</option>
                <option value="too_frequent">Emails are too frequent</option>
                <option value="not_relevant">Content isn't relevant</option>
                <option value="never_signed_up">I never signed up</option>
                <option value="privacy">Privacy concerns</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Updating...' : 'Update Preferences'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
            Return to SUCCESS Magazine
          </a>
        </div>
      </div>
    </div>
  );
}
