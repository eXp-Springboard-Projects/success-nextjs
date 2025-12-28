import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import { Upload, X } from 'lucide-react';
import styles from './ResourceForm.module.css';

export default function UploadResourcePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TEMPLATES',
    thumbnail: '',
  });

  const categories = ['TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (formData.thumbnail) data.append('thumbnail', formData.thumbnail);

      const res = await fetch('/api/admin/resources/upload', {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        alert('Resource uploaded successfully!');
        router.push('/admin/resources');
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Upload Resource</h1>
          <p className={styles.subtitle}>Upload a file to the resource library</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fileUpload}>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className={styles.fileInput}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
            />
            <label htmlFor="file" className={styles.fileLabel}>
              {file ? (
                <div className={styles.fileSelected}>
                  <Upload size={32} />
                  <div>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className={styles.removeFile}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className={styles.filePrompt}>
                  <Upload size={48} />
                  <div className={styles.filePromptText}>
                    Click to upload or drag and drop
                  </div>
                  <div className={styles.filePromptHint}>
                    PDF, DOC, XLS, ZIP (max 50MB)
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. 2024 Business Planning Template"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Describe what this resource contains and how it helps members..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={styles.select}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="thumbnail">Thumbnail URL (optional)</label>
            <input
              type="url"
              id="thumbnail"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className={styles.input}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
