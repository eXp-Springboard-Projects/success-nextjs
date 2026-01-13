import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import { User, Lock, Upload, X } from 'lucide-react';
import styles from './AccountSettings.module.css';

export default function AccountSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePicture, setProfilePicture] = useState(session?.user?.image || '');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload image');
        setPreviewUrl('');
        setUploading(false);
        return;
      }

      setProfilePicture(data.url);
      setSuccess('Profile picture updated successfully!');

      // Update session
      await update({ image: data.url });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Remove your profile picture?')) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/upload-profile-picture', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to remove picture');
        setUploading(false);
        return;
      }

      setProfilePicture('');
      setPreviewUrl('');
      setSuccess('Profile picture removed');

      // Update session
      await update({ image: null });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return null;
  }

  const displayImage = previewUrl || profilePicture;
  const initials = session.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Account Settings</h1>
            <p className={styles.subtitle}>Manage your profile and security settings</p>
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <User size={20} />
            <h2>Profile Picture</h2>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success}>
              {success}
            </div>
          )}

          <div className={styles.profilePictureCard}>
            <div className={styles.avatarSection}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={session.user?.name || 'Profile'}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {initials}
                </div>
              )}
              <div className={styles.avatarInfo}>
                <h3>{session.user?.name}</h3>
                <p>{session.user?.email}</p>
                <p className={styles.role}>{session.user?.role}</p>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={styles.uploadButton}
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>

              {displayImage && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className={styles.removeButton}
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <p className={styles.hint}>
              JPG, PNG or GIF. Max size 5MB. Recommended 400x400px.
            </p>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Lock size={20} />
            <h2>Security</h2>
          </div>

          <Link href="/admin/account/password" className={styles.securityLink}>
            <div className={styles.linkContent}>
              <div>
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
