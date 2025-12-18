import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './AdminVideos.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Video {
  id: string;
  title: string;
  slug: string;
  videoUrl: string;
  thumbnail?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminVideos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchVideos();
    }
  }, [session]);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/videos?per_page=100');
      const data = await res.json();
      setVideos(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos(videos.filter(v => v.id !== id));
      } else {
        throw new Error('Failed to delete video');
      }
    } catch (error) {
      alert('Failed to delete video');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading videos...</div>
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
          <h1>Videos</h1>
          <Link href="/admin/videos/new" className={styles.addButton}>
            + New Video
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className={styles.empty}>
            <p>No videos yet. Create your first video!</p>
            <Link href="/admin/videos/new" className={styles.addButton}>
              + New Video
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {videos.map((video) => (
              <div key={video.id} className={styles.videoCard}>
                <div className={styles.thumbnail}>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} />
                  ) : (
                    <div className={styles.placeholderThumbnail}>🎥</div>
                  )}
                  <span className={`${styles.status} ${styles[`status-${video.status.toLowerCase()}`]}`}>
                    {video.status}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.title}>{video.title}</h3>
                  <p className={styles.slug}>{video.slug}</p>
                  <p className={styles.date}>
                    {new Date(video.publishedAt || video.createdAt).toLocaleDateString()}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/admin/videos/${video.id}/edit`} className={styles.editButton}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(video.id)} className={styles.deleteButton}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
