import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { Star, Plus, X, Save, AlertCircle } from 'lucide-react';
import styles from './FeaturedContent.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Placement {
  id: string;
  postId: string;
  zone: string;
  position: number;
  post?: {
    id: string;
    title: string;
    slug: string;
    featuredImage?: string;
  };
}

interface Post {
  id: string;
  title: { rendered: string };
  slug: string;
  _embedded?: any;
}

const ZONES = [
  { id: 'hero', name: 'Hero / Main Featured', slots: 1 },
  { id: 'secondary', name: 'Secondary Grid', slots: 4 },
  { id: 'trending', name: 'Trending Section', slots: 3 },
];

export default function FeaturedContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [setupSQL, setSetupSQL] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('hero');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch placements
      const placementsRes = await fetch('/api/admin/featured/placements');
      if (placementsRes.ok) {
        const placementsData = await placementsRes.json();
        setPlacements(placementsData);
      } else if (placementsRes.status === 500) {
        // Table might not exist, try setup
        const setupRes = await fetch('/api/admin/featured/setup', { method: 'POST' });
        const setupData = await setupRes.json();
        if (!setupData.success && setupData.sql) {
          setSetupNeeded(true);
          setSetupSQL(setupData.sql);
        }
      }

      // Fetch recent posts
      const postsRes = await fetch('/api/posts?per_page=100&_embed');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addPlacement(postId: string, zone: string, position: number) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/featured/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, zone, position }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to add placement: ${error.message || error.error}`);
      }
    } catch (error) {
      alert('Failed to add placement');
    } finally {
      setSaving(false);
    }
  }

  async function removePlacement(id: string) {
    if (!confirm('Remove this placement?')) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/featured/placements?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to remove placement');
      }
    } catch (error) {
      alert('Failed to remove placement');
    } finally {
      setSaving(false);
    }
  }

  function getPlacementsForZone(zone: string) {
    return placements
      .filter(p => p.zone === zone)
      .sort((a, b) => a.position - b.position);
  }

  function getPostById(postId: string) {
    return posts.find(p => String(p.id) === postId || String(p.id) === String(parseInt(postId)));
  }

  function isPostInZone(postId: string, zone: string) {
    return placements.some(p => p.postId === postId && p.zone === zone);
  }

  const filteredPosts = posts.filter(post =>
    post.title.rendered.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (setupNeeded) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.setupMessage}>
            <AlertCircle size={48} />
            <h2>Database Setup Required</h2>
            <p>The homepage_placements table needs to be created. Please follow these steps:</p>
            <ol>
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to SQL Editor</li>
              <li>Paste the SQL below and click "Run"</li>
              <li>Refresh this page</li>
            </ol>
            <textarea
              readOnly
              value={setupSQL}
              className={styles.sqlBox}
              rows={20}
            />
            <button
              onClick={() => navigator.clipboard.writeText(setupSQL)}
              className={styles.copyButton}
            >
              Copy SQL
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1><Star size={28} /> Featured Content Manager</h1>
            <p>Control which articles appear on the homepage and where they are displayed</p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.zonesPanel}>
            <h2>Homepage Zones</h2>
            {ZONES.map(zone => {
              const zonePlacements = getPlacementsForZone(zone.id);
              const availableSlots = zone.slots - zonePlacements.length;

              return (
                <div key={zone.id} className={styles.zone}>
                  <div className={styles.zoneHeader}>
                    <h3>{zone.name}</h3>
                    <span className={styles.slots}>
                      {zonePlacements.length} / {zone.slots} slots
                    </span>
                  </div>

                  <div className={styles.placements}>
                    {zonePlacements.length === 0 ? (
                      <p className={styles.empty}>No articles assigned</p>
                    ) : (
                      zonePlacements.map((placement, index) => {
                        const post = getPostById(placement.postId);
                        if (!post) return null;

                        return (
                          <div key={placement.id} className={styles.placement}>
                            <span className={styles.position}>{index + 1}.</span>
                            <span className={styles.title}>
                              {post.title.rendered || 'Untitled'}
                            </span>
                            <button
                              onClick={() => removePlacement(placement.id)}
                              className={styles.removeButton}
                              disabled={saving}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {availableSlots > 0 && (
                    <button
                      onClick={() => setSelectedZone(zone.id)}
                      className={styles.addButton}
                    >
                      <Plus size={16} /> Add Article ({availableSlots} slots available)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.postsPanel}>
            <h2>Available Articles</h2>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />

            <div className={styles.postsList}>
              {filteredPosts.slice(0, 50).map(post => {
                const inSelectedZone = isPostInZone(post.id.toString(), selectedZone);
                const zonePlacements = getPlacementsForZone(selectedZone);
                const selectedZoneInfo = ZONES.find(z => z.id === selectedZone);
                const canAdd = !inSelectedZone && zonePlacements.length < (selectedZoneInfo?.slots || 0);

                return (
                  <div key={post.id} className={styles.post}>
                    <div className={styles.postInfo}>
                      <h4>{post.title.rendered || 'Untitled'}</h4>
                      <p className={styles.slug}>/{post.slug}</p>
                    </div>
                    {canAdd ? (
                      <button
                        onClick={() => addPlacement(post.id.toString(), selectedZone, zonePlacements.length)}
                        className={styles.addPostButton}
                        disabled={saving}
                      >
                        <Plus size={16} /> Add to {selectedZoneInfo?.name}
                      </button>
                    ) : inSelectedZone ? (
                      <span className={styles.inZone}>In {selectedZoneInfo?.name}</span>
                    ) : (
                      <span className={styles.zoneFull}>Zone Full</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
