/**
 * Post Composer Page
 * Create and edit social media posts
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSocialPosts } from '@/hooks/social/useSocialPosts';
import { useSocialAccounts } from '@/hooks/social/useSocialAccounts';
import { useMediaLibrary } from '@/hooks/social/useMediaLibrary';
import { Platform, PLATFORM_NAMES, PLATFORM_LIMITS, MediaItem } from '@/types/social';
import styles from './SocialMedia.module.css';
import { requireSocialMediaAuth } from '@/lib/adminAuth';

export default function PostComposerPage() {
  const router = useRouter();
  const { createPost, updatePost } = useSocialPosts({ autoFetch: false });
  const { accounts } = useSocialAccounts();
  const { media, uploadMedia, uploading } = useMediaLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setError(null);
      for (const file of Array.from(files)) {
        const mediaItem = await uploadMedia(file);
        setSelectedMediaIds((prev) => [...prev, mediaItem.id]);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) => prev.filter((id) => id !== mediaId));
  };

  const selectedMediaItems = media.filter((m) => selectedMediaIds.includes(m.id));

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
        mediaIds: selectedMediaIds.length > 0 ? selectedMediaIds : undefined,
        linkUrl: linkUrl.trim() || undefined,
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Link URL (optional)</label>
              <input
                type="url"
                className={styles.input}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/article"
              />
              <p className={styles.helperText}>
                Add a link to share with your post
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Media (Images/Videos)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={styles.secondaryButton}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '📎 Upload Media'}
              </button>

              {selectedMediaItems.length > 0 && (
                <div className={styles.mediaPreviewGrid}>
                  {selectedMediaItems.map((item) => (
                    <div key={item.id} className={styles.mediaPreviewItem}>
                      {item.fileType.startsWith('image/') ? (
                        <img src={item.fileUrl} alt={item.altText || item.fileName} />
                      ) : (
                        <video src={item.fileUrl} controls />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className={styles.removeMediaButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className={styles.helperText}>
                Upload images or videos to include with your post
              </p>
            </div>

            <div className={styles.formActions}>
              <button
                onClick={() => handleSave('draft')}
                className={styles.secondaryButton}
                disabled={saving || Boolean(isOverLimit)}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave('scheduled')}
                className={styles.primaryButton}
                disabled={saving || Boolean(isOverLimit) || !scheduledDate || !scheduledTime}
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

export const getServerSideProps = requireSocialMediaAuth;
