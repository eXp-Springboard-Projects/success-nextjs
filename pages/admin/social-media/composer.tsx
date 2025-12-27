/**
 * Post Composer Page
 * Create and edit social media posts
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSocialPosts } from '@/hooks/social/useSocialPosts';
import { useSocialAccounts } from '@/hooks/social/useSocialAccounts';
import { Platform, PLATFORM_NAMES, PLATFORM_LIMITS } from '@/types/social';
import styles from './SocialMedia.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function PostComposerPage() {
  const router = useRouter();
  const { createPost, updatePost } = useSocialPosts({ autoFetch: false });
  const { accounts } = useSocialAccounts();

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedPlatforms = accounts.map((a) => a.platform);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return null;
    return Math.min(...selectedPlatforms.map((p) => PLATFORM_LIMITS[p]));
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = characterLimit && content.length > characterLimit;

  const handleSave = async (status: 'draft' | 'scheduled') => {
    try {
      setSaving(true);
      setError(null);

      if (!content.trim()) {
        throw new Error('Content is required');
      }

      if (selectedPlatforms.length === 0) {
        throw new Error('Select at least one platform');
      }

      if (status === 'scheduled' && (!scheduledDate || !scheduledTime)) {
        throw new Error('Schedule date and time are required');
      }

      const scheduledAt = status === 'scheduled'
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : new Date();

      await createPost({
        content,
        targetPlatforms: selectedPlatforms,
        scheduledAt,
      });

      router.push('/admin/social-media');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Create Post</h1>
            <p>Compose and schedule your social media post</p>
          </div>
        </div>

        {error && (
          <div className={`${styles.message} ${styles.error}`}>
            {error}
            <button onClick={() => setError(null)} className={styles.closeMessage}>×</button>
          </div>
        )}

        <div className={styles.composerGrid}>
          <div className={styles.composerMain}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Post Content *</label>
              <textarea
                className={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={8}
              />
              {characterLimit && (
                <div className={`${styles.characterCount} ${isOverLimit ? styles.overLimit : ''}`}>
                  {content.length} / {characterLimit} characters
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Platforms *</label>
              <div className={styles.platformSelector}>
                {connectedPlatforms.map((platform) => (
                  <label key={platform} className={styles.platformCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                    />
                    <span>{PLATFORM_NAMES[platform]}</span>
                  </label>
                ))}
              </div>
              {connectedPlatforms.length === 0 && (
                <p className={styles.helperText}>
                  No accounts connected.{' '}
                  <a href="/admin/social-media/accounts">Connect an account</a>
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Schedule</label>
              <div className={styles.dateTimeGrid}>
                <input
                  type="date"
                  className={styles.input}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  className={styles.input}
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                onClick={() => handleSave('draft')}
                className={styles.secondaryButton}
                disabled={saving || isOverLimit}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave('scheduled')}
                className={styles.primaryButton}
                disabled={saving || isOverLimit || !scheduledDate || !scheduledTime}
              >
                {saving ? 'Scheduling...' : 'Schedule Post'}
              </button>
            </div>
          </div>

          <div className={styles.composerSidebar}>
            <div className={styles.helpBox}>
              <h3>Tips</h3>
              <ul>
                <li>Keep it concise and engaging</li>
                <li>Check character limits for each platform</li>
                <li>Schedule during peak engagement times</li>
                <li>Use hashtags strategically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
