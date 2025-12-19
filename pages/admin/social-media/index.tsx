/**
 * Social Media Connections Page
 * Connect and manage social media accounts for auto-posting
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './SocialMedia.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  lastError: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
}

const PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '𝕏',
    color: '#000000',
    description: 'Post tweets up to 280 characters',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0077b5',
    description: 'Share professional content',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    description: 'Post to your Facebook page',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#e4405f',
    description: 'Share photos and videos',
  },
];

export default function SocialMediaConnections() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchAccounts();
    }
  }, [status, router]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/social-media/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/admin/social-media/oauth/${platform}/authorize`;
    } catch (err: any) {
      setError(err.message || 'Failed to connect account');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/social-media/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to disconnect account');
      }

      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect account');
    }
  };

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(acc => acc.platform === platformId);
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>📱 Social Media Auto-Poster</h1>
            <p className={styles.subtitle}>
              Connect your social media accounts to schedule and auto-post content
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => router.push('/admin/social-media/scheduler')}
              className={styles.primaryButton}
            >
              📅 Schedule Post
            </button>
            <button
              onClick={() => router.push('/admin/social-media/queue')}
              className={styles.secondaryButton}
            >
              📋 View Queue
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError('')} className={styles.closeButton}>×</button>
          </div>
        )}

        <div className={styles.platforms}>
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.id);
            const isConnected = !!account;

            return (
              <div key={platform.id} className={styles.platformCard}>
                <div
                  className={styles.platformIcon}
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className={styles.platformInfo}>
                  <h3>{platform.name}</h3>
                  <p>{platform.description}</p>

                  {isConnected && account && (
                    <div className={styles.accountInfo}>
                      <div className={styles.accountName}>
                        ✓ Connected as <strong>{account.accountName}</strong>
                      </div>
                      {account.lastError && (
                        <div className={styles.accountError}>
                          ⚠️ {account.lastError}
                        </div>
                      )}
                      {account.tokenExpiresAt && (
                        <div className={styles.accountExpiry}>
                          Expires: {new Date(account.tokenExpiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.platformActions}>
                  {isConnected && account ? (
                    <>
                      <div className={`${styles.status} ${account.isActive ? styles.active : styles.inactive}`}>
                        {account.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </div>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className={styles.disconnectButton}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className={styles.connectButton}
                    >
                      Connect {platform.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.infoCard}>
          <h3>📘 How It Works</h3>
          <ol>
            <li><strong>Connect Accounts:</strong> Click "Connect" on any platform above to authorize access</li>
            <li><strong>Schedule Posts:</strong> Create and schedule posts to multiple platforms at once</li>
            <li><strong>Auto-Post Articles:</strong> Automatically share published articles to your social channels</li>
            <li><strong>Track Results:</strong> View posting history and engagement metrics</li>
          </ol>

          <h3 style={{ marginTop: '2rem' }}>🔐 Privacy & Security</h3>
          <p>
            Your social media credentials are securely encrypted and stored. We only request the minimum
            permissions needed to post content on your behalf. You can disconnect any account at any time.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
