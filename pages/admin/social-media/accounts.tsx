/**
 * Social Media Accounts Page
 * Manage connected social media accounts
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSocialAccounts } from '@/hooks/social/useSocialAccounts';
import { PLATFORM_NAMES, PLATFORM_COLORS, Platform } from '@/types/social';
import styles from './SocialMedia.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function SocialMediaAccountsPage() {
  const router = useRouter();
  const { accounts, loading, error, connect, disconnect } = useSocialAccounts();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Handle OAuth callback messages
    if (router.query.connected) {
      setMessage({
        type: 'success',
        text: `Successfully connected ${PLATFORM_NAMES[router.query.connected as Platform]}!`,
      });
      // Clean up URL
      router.replace('/admin/social-media/accounts', undefined, { shallow: true });
    }

    if (router.query.error) {
      setMessage({
        type: 'error',
        text: `Error: ${router.query.error}`,
      });
      router.replace('/admin/social-media/accounts', undefined, { shallow: true });
    }
  }, [router]);

  const handleConnect = (platform: Platform) => {
    connect(platform);
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
      try {
        await disconnect(accountId);
        setMessage({ type: 'success', text: `${platform} account disconnected` });
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    }
  };

  const platforms: Platform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'threads'];
  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Connected Accounts</h1>
          <p>Connect your social media accounts to start scheduling posts</p>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
          </div>
        )}

        {error && (
          <div className={`${styles.message} ${styles.error}`}>
            {error.message}
          </div>
        )}

        <div className={styles.accountsGrid}>
          {platforms.map((platform) => {
            const account = accounts.find((a) => a.platform === platform);
            const isConnected = connectedPlatforms.has(platform);
            const isAvailable = platform === 'twitter' || platform === 'linkedin';

            return (
              <div
                key={platform}
                className={`${styles.accountCard} ${isConnected ? styles.connected : ''}`}
                style={{ borderLeftColor: PLATFORM_COLORS[platform] }}
              >
                <div className={styles.accountHeader}>
                  <div
                    className={styles.platformIcon}
                    style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                  >
                    {PLATFORM_NAMES[platform].charAt(0)}
                  </div>
                  <div>
                    <h3>{PLATFORM_NAMES[platform]}</h3>
                    {isConnected && account && (
                      <p className={styles.accountUsername}>@{account.platformUsername}</p>
                    )}
                  </div>
                </div>

                <div className={styles.accountBody}>
                  {isConnected && account ? (
                    <>
                      <div className={styles.accountInfo}>
                        <p><strong>Display Name:</strong> {account.platformDisplayName}</p>
                        <p><strong>Connected:</strong> {new Date(account.createdAt).toLocaleDateString()}</p>
                        <p>
                          <strong>Status:</strong>{' '}
                          <span className={account.isActive ? styles.statusActive : styles.statusInactive}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDisconnect(account.id, PLATFORM_NAMES[platform])}
                        className={styles.disconnectButton}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={styles.accountDescription}>
                        {isAvailable
                          ? `Connect your ${PLATFORM_NAMES[platform]} account to schedule posts`
                          : 'Coming soon'}
                      </p>
                      <button
                        onClick={() => handleConnect(platform)}
                        className={styles.connectButton}
                        disabled={!isAvailable || loading}
                      >
                        {isAvailable ? 'Connect Account' : 'Coming Soon'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.helpSection}>
          <h2>Need Help?</h2>
          <ul>
            <li>Each platform requires OAuth authorization</li>
            <li>You can connect multiple accounts per platform</li>
            <li>Disconnecting will not delete scheduled posts</li>
            <li>Tokens are securely encrypted in the database</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
