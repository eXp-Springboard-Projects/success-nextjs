import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './AdminPodcasts.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Podcast {
  id: string;
  title: string;
  slug: string;
  audioUrl: string;
  thumbnail?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminPodcasts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPodcasts();
    }
  }, [session]);

  const fetchPodcasts = async () => {
    try {
      const res = await fetch('/api/podcasts?per_page=100');
      const data = await res.json();
      setPodcasts(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      const res = await fetch(`/api/podcasts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPodcasts(podcasts.filter(p => p.id !== id));
      } else {
        throw new Error('Failed to delete podcast');
      }
    } catch (error) {
      alert('Failed to delete podcast');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading podcasts...</div>
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
          <h1>Podcasts</h1>
          <Link href="/admin/podcasts/new" className={styles.addButton}>
            + New Podcast
          </Link>
        </div>

        {podcasts.length === 0 ? (
          <div className={styles.empty}>
            <p>No podcasts yet. Create your first podcast!</p>
            <Link href="/admin/podcasts/new" className={styles.addButton}>
              + New Podcast
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {podcasts.map((podcast) => (
              <div key={podcast.id} className={styles.videoCard}>
                <div className={styles.thumbnail}>
                  {podcast.thumbnail ? (
                    <img src={podcast.thumbnail} alt={podcast.title} />
                  ) : (
                    <div className={styles.placeholderThumbnail}>🎙️</div>
                  )}
                  <span className={`${styles.status} ${styles[`status-${podcast.status.toLowerCase()}`]}`}>
                    {podcast.status}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.title}>{podcast.title}</h3>
                  <p className={styles.slug}>{podcast.slug}</p>
                  <p className={styles.date}>
                    {new Date(podcast.publishedAt || podcast.createdAt).toLocaleDateString()}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/admin/podcasts/${podcast.id}/edit`} className={styles.editButton}>
                      Edit
                    </Link>
                    <Link href={`/podcast/${podcast.slug}`} className={styles.viewButton} target="_blank">
                      View
                    </Link>
                    <button onClick={() => handleDelete(podcast.id)} className={styles.deleteButton}>
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
