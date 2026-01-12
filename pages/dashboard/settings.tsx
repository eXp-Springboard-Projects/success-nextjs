import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  interests: string[];
  membershipTier: string;
  subscriptionStatus: string;
  subscriptionTier: string | null;
  currentPeriodEnd: string | null;
  jobTitle: string | null;
  website: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialFacebook: string | null;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'interests' | 'subscription' | 'password'>('profile');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    jobTitle: '',
    website: '',
    socialTwitter: '',
    socialLinkedin: '',
    socialFacebook: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [interestsData, setInterestsData] = useState<string[]>([]);

  const availableInterests = [
    'Leadership',
    'Entrepreneurship',
    'Business Strategy',
    'Personal Development',
    'Sales & Marketing',
    'Finance & Money',
    'Health & Wellness',
    'Productivity',
    'Technology',
    'Innovation',
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/settings');
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/dashboard/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        jobTitle: data.jobTitle || '',
        website: data.website || '',
        socialTwitter: data.socialTwitter || '',
        socialLinkedin: data.socialLinkedin || '',
        socialFacebook: data.socialFacebook || '',
      });
      setInterestsData(data.interests || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        fetchSettings();
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterests = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: interestsData }),
      });

      if (response.ok) {
        setMessage('Interests updated successfully!');
        fetchSettings();
      } else {
        setMessage('Failed to update interests');
      }
    } catch (error) {
      setMessage('Error updating interests');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage(result.error || 'Failed to update password');
      }
    } catch (error) {
      setMessage('Error updating password');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterestsData((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Settings - SUCCESS+ Dashboard</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <div className={styles.logoText}>SUCCESS+</div>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <a href="https://labs.success.com/" target="_blank" rel="noopener noreferrer">
              <button><span className={styles.icon}>👥</span> Community</button>
            </a>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button className={styles.active}><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
            <button className={styles.logoutBtn} onClick={() => router.push('/api/auth/signout')}>
              <span className={styles.icon}>🚪</span> Log Out
            </button>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Settings</h1>
            <p className={styles.subtitle}>Manage your account and preferences</p>
          </div>

          {message && (
            <div className={message.includes('successfully') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}

          <div className={styles.settingsTabs}>
            <button
              className={activeTab === 'profile' ? styles.activeTab : ''}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={activeTab === 'interests' ? styles.activeTab : ''}
              onClick={() => setActiveTab('interests')}
            >
              Interests
            </button>
            <button
              className={activeTab === 'subscription' ? styles.activeTab : ''}
              onClick={() => setActiveTab('subscription')}
            >
              Subscription
            </button>
            <button
              className={activeTab === 'password' ? styles.activeTab : ''}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
          </div>

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" value={settings?.email} disabled />
              </div>

              <div className={styles.formGroup}>
                <label>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <h3>Social Media</h3>

              <div className={styles.formGroup}>
                <label>Twitter</label>
                <input
                  type="text"
                  value={formData.socialTwitter}
                  onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div className={styles.formGroup}>
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialLinkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinkedin: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Facebook</label>
                <input
                  type="url"
                  value={formData.socialFacebook}
                  onChange={(e) => setFormData({ ...formData, socialFacebook: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'interests' && (
            <div className={styles.interestsSection}>
              <p>Select your areas of interest to personalize your experience:</p>

              <div className={styles.interestsGrid}>
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    className={
                      interestsData.includes(interest)
                        ? styles.interestActive
                        : styles.interestInactive
                    }
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <button
                className={styles.saveBtn}
                onClick={handleSaveInterests}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Interests'}
              </button>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className={styles.subscriptionSection}>
              <div className={styles.subscriptionCard}>
                <h3>Current Subscription</h3>
                <div className={styles.subscriptionInfo}>
                  <div className={styles.subscriptionDetail}>
                    <strong>Tier:</strong> {settings?.membershipTier || 'FREE'}
                  </div>
                  <div className={styles.subscriptionDetail}>
                    <strong>Status:</strong>{' '}
                    <span
                      className={
                        settings?.subscriptionStatus === 'active'
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {settings?.subscriptionStatus || 'inactive'}
                    </span>
                  </div>
                  {settings?.currentPeriodEnd && (
                    <div className={styles.subscriptionDetail}>
                      <strong>Renews:</strong>{' '}
                      {new Date(settings.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <Link href="/subscribe" className={styles.upgradeBtn}>
                  Manage Subscription
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
