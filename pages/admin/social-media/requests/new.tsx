import { useState } from 'react';
import { useRouter } from 'next/router';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../../crm/contacts/Contacts.module.css';

export default function NewSocialMediaRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkUrl: '',
    imageUrl: '',
    priority: 'medium',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/social-media/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/social-media/requests');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to create request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.MARKETING}
      pageTitle="New Social Media Request"
      description="Submit a new social media content request"
    >
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>New Social Media Request</h1>
            <p className={styles.pageDescription}>Submit a request to the social media team</p>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {/* Title */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={styles.searchInput}
                  style={{ width: '100%' }}
                  placeholder="e.g., Instagram post for new product launch"
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.searchInput}
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                  placeholder="Provide details about what you need the social media team to create or post..."
                />
              </div>

              {/* Link URL */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="linkUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                  Link URL
                </label>
                <input
                  type="url"
                  id="linkUrl"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleInputChange}
                  className={styles.searchInput}
                  style={{ width: '100%' }}
                  placeholder="https://example.com/article"
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  If this request relates to a specific article, product, or page, paste the URL here
                </small>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                  Image
                </label>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="imageFile"
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: '#fff',
                      borderRadius: '4px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? 'Uploading...' : '📁 Upload Image'}
                  </label>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <small style={{ marginLeft: '1rem', color: '#666', fontSize: '0.875rem' }}>
                    Max 5MB
                  </small>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <label htmlFor="imageUrl" style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                    Or paste image URL:
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {formData.imageUrl && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Preview:</p>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="priority" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Within this week</option>
                  <option value="high">High - Within 1-2 days</option>
                  <option value="urgent">Urgent - ASAP/Today</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={styles.secondaryButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving || uploading}
                  style={{ opacity: (saving || uploading) ? 0.6 : 1 }}
                >
                  {saving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.MARKETING);
