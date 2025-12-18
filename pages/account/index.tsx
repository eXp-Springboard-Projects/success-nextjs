import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from './account.module.css';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/account');
    } else if (status === 'authenticated') {
      fetchAccountData();
    }
  }, [status, router]);

  async function fetchAccountData() {
    try {
      const response = await fetch('/api/account');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSubscription(data.subscription);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setEditing(false);
        setMessage('Profile updated successfully');
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading your account...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className={styles.error}>Failed to load account data</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>My Account</h1>

        {/* Profile Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Profile Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className={styles.editButton}
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleUpdateProfile} className={styles.form}>
              <div className={styles.field}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.saveButton}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                    });
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.info}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Name:</span>
                <span className={styles.value}>{user.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Member Since:</span>
                <span className={styles.value}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          {message && (
            <div className={message.includes('success') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className={styles.section}>
          <h2>Subscription</h2>
          {subscription ? (
            <div className={styles.subscription}>
              <div className={styles.subscriptionStatus}>
                <span className={`${styles.badge} ${styles[subscription.status.toLowerCase()]}`}>
                  {subscription.status}
                </span>
              </div>
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Plan:</span>
                  <span className={styles.value}>SUCCESS+</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Current Period:</span>
                  <span className={styles.value}>
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className={styles.warning}>
                    Your subscription will cancel on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                <a href="/account/billing" className={styles.button}>
                  Manage Billing
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.noSubscription}>
              <p>You don't have an active subscription.</p>
              <a href="/subscribe" className={styles.button}>
                Subscribe to SUCCESS+
              </a>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className={styles.section}>
          <h2>Preferences</h2>
          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Newsletter:</span>
              <span className={styles.value}>
                <a href="/account/preferences">Manage preferences</a>
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Bookmarks:</span>
              <span className={styles.value}>
                <a href="/account/bookmarks">View saved articles</a>
              </span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.section}>
          <h2>Security</h2>
          <div className={styles.actions}>
            <a href="/account/change-password" className={styles.button}>
              Change Password
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Force SSR to prevent NextRouter errors during build
export async function getServerSideProps() {
  return {
    props: {},
  };
}
