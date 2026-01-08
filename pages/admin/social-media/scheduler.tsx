/**
 * Social Media Post Scheduler
 * Create and schedule posts to multiple platforms with calendar view
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './Scheduler.module.css';
import { requireSocialMediaAuth } from '@/lib/adminAuth';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
}

const PLATFORM_LIMITS = {
  twitter: { chars: 280, name: 'Twitter / X' },
  linkedin: { chars: 3000, name: 'LinkedIn' },
  facebook: { chars: 63206, name: 'Facebook' },
  instagram: { chars: 2200, name: 'Instagram' },
  youtube: { chars: 5000, name: 'YouTube' },
  tiktok: { chars: 2200, name: 'TikTok' },
};

export default function SocialMediaScheduler() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchAccounts();

      // Set default datetime to 1 hour from now
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setScheduledDate(now.toISOString().split('T')[0]);
      setScheduledTime(now.toTimeString().substring(0, 5));
    }
  }, [status, router]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/social-media/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);

        // Auto-select active accounts
        const activeAccounts = data.accounts
          .filter((acc: SocialAccount) => acc.isActive)
          .map((acc: SocialAccount) => acc.platform);
        setSelectedPlatforms(activeAccounts);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const getCharCount = (platform: string) => {
    const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
    if (!limit) return { count: content.length, limit: 0, percentage: 0 };

    const count = content.length;
    const percentage = (count / limit.chars) * 100;
    return { count, limit: limit.chars, percentage };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!content.trim()) {
      setError('Please enter post content');
      return;
    }

    setLoading(true);

    try {
      const scheduledAt = scheduleType === 'scheduled'
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null;

      const res = await fetch('/api/admin/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl || null,
          linkUrl: linkUrl || null,
          platforms: selectedPlatforms,
          scheduledAt,
          postNow: scheduleType === 'now',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      setSuccess(
        scheduleType === 'now'
          ? 'Post published successfully!'
          : `Post scheduled for ${new Date(scheduledAt!).toLocaleString()}`
      );

      // Reset form
      setContent('');
      setImageUrl('');
      setLinkUrl('');

      // Redirect to queue after success
      setTimeout(() => {
        router.push('/admin/social-media/queue');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const connectedAccounts = accounts.filter(acc => acc.isActive);

  if (connectedAccounts.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2>📱 No Social Media Accounts Connected</h2>
            <p>Connect your social media accounts to start scheduling posts</p>
            <button
              onClick={() => router.push('/admin/social-media')}
              className={styles.primaryButton}
            >
              Connect Accounts
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>📅 Schedule Social Media Post</h1>
            <p className={styles.subtitle}>
              Create and schedule posts to multiple platforms at once
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/social-media')}
            className={styles.backButton}
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* Left Column - Post Content */}
            <div className={styles.column}>
              <div className={styles.card}>
                <h3>✍️ Post Content</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="content">Text Content *</label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={8}
                    className={styles.textarea}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="imageUrl">Image URL (Optional)</label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={styles.input}
                  />
                  <small>Direct link to an image file</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="linkUrl">Link URL (Optional)</label>
                  <input
                    id="linkUrl"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://www.success.com/article"
                    className={styles.input}
                  />
                  <small>Link to share with the post</small>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className={styles.card}>
                <h3>⏰ Schedule Settings</h3>

                <div className={styles.scheduleType}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={scheduleType === 'now'}
                      onChange={() => setScheduleType('now')}
                    />
                    <span>Post Immediately</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={scheduleType === 'scheduled'}
                      onChange={() => setScheduleType('scheduled')}
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>

                {scheduleType === 'scheduled' && (
                  <div className={styles.scheduleDateTime}>
                    <div className={styles.formGroup}>
                      <label htmlFor="scheduledDate">Date</label>
                      <input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className={styles.input}
                        required={scheduleType === 'scheduled'}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="scheduledTime">Time</label>
                      <input
                        id="scheduledTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className={styles.input}
                        required={scheduleType === 'scheduled'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Platform Selection & Preview */}
            <div className={styles.column}>
              <div className={styles.card}>
                <h3>📱 Select Platforms</h3>

                <div className={styles.platformsList}>
                  {connectedAccounts.map((account) => {
                    const isSelected = selectedPlatforms.includes(account.platform);
                    const charInfo = getCharCount(account.platform);
                    const isOverLimit = charInfo.count > charInfo.limit;

                    return (
                      <div key={account.id} className={styles.platformItem}>
                        <label className={styles.platformLabel}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePlatform(account.platform)}
                            className={styles.checkbox}
                          />
                          <div className={styles.platformDetails}>
                            <div className={styles.platformName}>
                              {PLATFORM_LIMITS[account.platform as keyof typeof PLATFORM_LIMITS]?.name || account.platform}
                            </div>
                            <div className={styles.platformAccount}>
                              @{account.accountName}
                            </div>
                          </div>
                        </label>

                        {isSelected && (
                          <div className={styles.charCount}>
                            <div
                              className={`${styles.charCountBar} ${isOverLimit ? styles.overLimit : ''}`}
                              style={{ width: `${Math.min(charInfo.percentage, 100)}%` }}
                            />
                            <span className={isOverLimit ? styles.overLimit : ''}>
                              {charInfo.count} / {charInfo.limit}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              {content && (
                <div className={styles.card}>
                  <h3>👁️ Preview</h3>
                  <div className={styles.preview}>
                    <div className={styles.previewContent}>
                      {content}
                    </div>
                    {imageUrl && (
                      <div className={styles.previewImage}>
                        <img src={imageUrl} alt="Post preview" onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }} />
                      </div>
                    )}
                    {linkUrl && (
                      <div className={styles.previewLink}>
                        🔗 {linkUrl}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {success && (
            <div className={styles.success}>{success}</div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/admin/social-media')}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedPlatforms.length === 0}
              className={styles.submitButton}
            >
              {loading ? 'Processing...' : scheduleType === 'now' ? '📤 Post Now' : '📅 Schedule Post'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireSocialMediaAuth;
