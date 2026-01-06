import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import styles from './magazine-cover-manager.module.css';

interface MagazineIssue {
  id: string;
  slug: string;
  title: string;
  publishDate: string;
  coverImageUrl: string;
  readerUrl: string;
  active: boolean;
}

export default function MagazineCoverManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIssue, setEditingIssue] = useState<MagazineIssue | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    publishDate: '',
    coverImageUrl: '',
    readerUrl: '',
  });

  useEffect(() => {
    if (session?.user?.role && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
      fetchIssues();
    }
  }, [session]);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/admin/magazine-issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'magazine-covers');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, coverImageUrl: data.url });
        alert('Image uploaded successfully!');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingIssue
        ? `/api/admin/magazine-issues/${editingIssue.id}`
        : '/api/admin/magazine-issues';

      const res = await fetch(url, {
        method: editingIssue ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(editingIssue ? 'Issue updated!' : 'Issue created!');
        setFormData({
          title: '',
          slug: '',
          publishDate: '',
          coverImageUrl: '',
          readerUrl: '',
        });
        setEditingIssue(null);
        fetchIssues();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save issue');
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      alert('Error saving issue');
    }
  };

  const handleEdit = (issue: MagazineIssue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      slug: issue.slug,
      publishDate: issue.publishDate,
      coverImageUrl: issue.coverImageUrl,
      readerUrl: issue.readerUrl,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const res = await fetch(`/api/admin/magazine-issues/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Issue deleted');
        fetchIssues();
      } else {
        alert('Failed to delete issue');
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Error deleting issue');
    }
  };

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user?.role)) {
    return (
      <div className={styles.unauthorized}>
        <h1>Unauthorized</h1>
        <p>You need admin or editor access to manage magazine covers.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Magazine Cover Manager - SUCCESS Admin</title>
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Back to Admin
          </button>
          <h1>Magazine Cover Manager</h1>
          <p className={styles.subtitle}>
            Manage magazine covers and digital reader links
          </p>
        </header>

        <div className={styles.content}>
          {/* Form Section */}
          <div className={styles.formSection}>
            <h2>{editingIssue ? 'Edit Issue' : 'Add New Issue'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Issue Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="January/February 2026"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="slug">URL Slug *</label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="january2026"
                  required
                />
                <small>Will be accessible at: /[slug]/reader</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="publishDate">Publish Date *</label>
                <input
                  type="text"
                  id="publishDate"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  placeholder="JANUARY / FEBRUARY 2026"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="coverImage">Cover Image *</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    id="coverImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.fileInput}
                  />
                  <label htmlFor="coverImage" className={styles.uploadButton}>
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <span className={styles.orText}>or</span>
                  <input
                    type="text"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    placeholder="Paste image URL"
                    className={styles.urlInput}
                  />
                </div>
                {formData.coverImageUrl && (
                  <div className={styles.imagePreview}>
                    <img src={formData.coverImageUrl} alt="Cover preview" />
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="readerUrl">Digital Reader URL *</label>
                <input
                  type="url"
                  id="readerUrl"
                  value={formData.readerUrl}
                  onChange={(e) => setFormData({ ...formData, readerUrl: e.target.value })}
                  placeholder="https://read.dmtmag.com/i/..."
                  required
                />
                <small>Flipbook URL from your magazine publisher</small>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingIssue ? 'Update Issue' : 'Add Issue'}
                </button>
                {editingIssue && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIssue(null);
                      setFormData({
                        title: '',
                        slug: '',
                        publishDate: '',
                        coverImageUrl: '',
                        readerUrl: '',
                      });
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className={styles.listSection}>
            <h2>Current Issues</h2>
            {loading ? (
              <p>Loading...</p>
            ) : issues.length === 0 ? (
              <p className={styles.emptyState}>No issues yet. Add your first issue above!</p>
            ) : (
              <div className={styles.issuesList}>
                {issues.map((issue) => (
                  <div key={issue.id} className={styles.issueCard}>
                    <div className={styles.issueCover}>
                      {issue.coverImageUrl && (
                        <img src={issue.coverImageUrl} alt={issue.title} />
                      )}
                    </div>
                    <div className={styles.issueInfo}>
                      <h3>{issue.title}</h3>
                      <p className={styles.issueDate}>{issue.publishDate}</p>
                      <p className={styles.issueSlug}>
                        <strong>URL:</strong> /{issue.slug}/reader
                      </p>
                      <div className={styles.issueActions}>
                        <button
                          onClick={() => handleEdit(issue)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <a
                          href={`/${issue.slug}/reader`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewButton}
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
