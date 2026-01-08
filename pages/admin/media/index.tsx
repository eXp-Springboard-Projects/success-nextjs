import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { exportImageToPDF } from '../../../lib/pdfExport';
import styles from './AdminMedia.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  createdAt: string;
}

export default function AdminMedia() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMedia();
    }
  }, [session]);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media?per_page=100');

      if (!res.ok) {
        const errorData = await res.json();
        // Check if it's a "table doesn't exist" error
        if (res.status === 500 && errorData.error) {
          alert(`Media library error: ${errorData.error}\n\nThe media table may not exist. Please contact your system administrator.`);
        }
        throw new Error(errorData.error || 'Failed to fetch media');
      }

      const data = await res.json();
      setMedia(data);
    } catch (error: any) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      await uploadFile(file);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newMedia = await res.json();
        setMedia([newMedia, ...media]);
        await fetchMedia(); // Refresh the full list
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }
    } catch (error) {
      alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return;

    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMedia(media.filter(m => m.id !== id));
        if (selectedMedia?.id === id) {
          setSelectedMedia(null);
        }
      } else {
        throw new Error('Failed to delete media');
      }
    } catch (error) {
      alert('Failed to delete media');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const handleExportPDF = async (item: MediaItem) => {
    if (!item.mimeType.startsWith('image/')) {
      alert('PDF export is only available for images');
      return;
    }

    try {
      await exportImageToPDF(
        item.url,
        item.filename,
        {
          'File Type': item.mimeType,
          'Size': formatFileSize(item.size),
          'Dimensions': item.width && item.height ? `${item.width} × ${item.height}` : 'N/A',
          'Uploaded': new Date(item.createdAt).toLocaleDateString()
        }
      );
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading media...</div>
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
          <h1>Media Library</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            {media.length === 0 ? (
              <div className={styles.empty}>
                <p>No media files yet. Upload your first file!</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.uploadButton}
                >
                  + Upload Files
                </button>
              </div>
            ) : (
              media.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.mediaCard} ${selectedMedia?.id === item.id ? styles.selected : ''}`}
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.alt || item.filename} className={styles.thumbnail} />
                  ) : item.mimeType.startsWith('video/') ? (
                    <div className={styles.iconPreview}>🎥</div>
                  ) : item.mimeType.startsWith('audio/') ? (
                    <div className={styles.iconPreview}>🎵</div>
                  ) : (
                    <div className={styles.iconPreview}>📄</div>
                  )}
                  <div className={styles.mediaInfo}>
                    <p className={styles.filename}>{item.filename}</p>
                    <p className={styles.fileSize}>{formatFileSize(item.size)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedMedia && (
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Media Details</h3>
                <button onClick={() => setSelectedMedia(null)} className={styles.closeButton}>×</button>
              </div>

              <div className={styles.preview}>
                {selectedMedia.mimeType.startsWith('image/') && (
                  <img src={selectedMedia.url} alt={selectedMedia.alt || selectedMedia.filename} />
                )}
              </div>

              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <strong>Filename:</strong>
                  <span>{selectedMedia.filename}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Type:</strong>
                  <span>{selectedMedia.mimeType}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Size:</strong>
                  <span>{formatFileSize(selectedMedia.size)}</span>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div className={styles.detailRow}>
                    <strong>Dimensions:</strong>
                    <span>{selectedMedia.width} × {selectedMedia.height}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <strong>Uploaded:</strong>
                  <span>{new Date(selectedMedia.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className={styles.urlSection}>
                <label>File URL</label>
                <div className={styles.urlInput}>
                  <input type="text" value={selectedMedia.url} readOnly />
                  <button onClick={() => copyToClipboard(selectedMedia.url)} className={styles.copyButton}>
                    Copy
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                {selectedMedia.mimeType.startsWith('image/') && (
                  <button onClick={() => handleExportPDF(selectedMedia)} className={styles.exportButton}>
                    📄 Export PDF
                  </button>
                )}
                <button onClick={() => handleDelete(selectedMedia.id)} className={styles.deleteButton}>
                  Delete Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
