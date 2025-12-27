import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import communityStyles from './community.module.css';

interface ForumTopic {
  id: string;
  title: string;
  category: string;
  author: string;
  authorAvatar: string;
  replies: number;
  views: number;
  lastActivity: string;
  isPinned: boolean;
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/community');
    } else if (status === 'authenticated') {
      fetchTopics();
    }
  }, [status]);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/dashboard/community-topics');
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'General Discussion', 'Success Stories', 'Accountability', 'Q&A', 'Networking'];

  const filteredTopics = selectedCategory === 'all'
    ? topics
    : topics.filter(topic => topic.category === selectedCategory);

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Community - SUCCESS+</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <Link href="/dashboard/community">
              <button className={styles.active}><span className={styles.icon}>👥</span> Community</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>SUCCESS+ Community</h1>
            <p className={styles.subtitle}>Connect, share, and grow with like-minded achievers</p>
          </div>

          <div className={communityStyles.communityWelcome}>
            <div className={communityStyles.welcomeCard}>
              <h2>👋 Welcome to the Community!</h2>
              <p>Join thousands of SUCCESS+ members sharing insights, celebrating wins, and supporting each other's growth journey.</p>
              <button
                className={communityStyles.newTopicBtn}
                onClick={() => window.open('https://mysuccessplus.com/community/new-topic', '_blank')}
              >
                ✏️ Start a Discussion
              </button>
            </div>
          </div>

          <div className={communityStyles.statsBar}>
            <div className={communityStyles.stat}>
              <span className={communityStyles.statValue}>12,487</span>
              <span className={communityStyles.statLabel}>Members</span>
            </div>
            <div className={communityStyles.stat}>
              <span className={communityStyles.statValue}>2,145</span>
              <span className={communityStyles.statLabel}>Topics</span>
            </div>
            <div className={communityStyles.stat}>
              <span className={communityStyles.statValue}>18,932</span>
              <span className={communityStyles.statLabel}>Posts</span>
            </div>
            <div className={communityStyles.stat}>
              <span className={communityStyles.statValue}>534</span>
              <span className={communityStyles.statLabel}>Online Now</span>
            </div>
          </div>

          <div className={communityStyles.categoryFilter}>
            {categories.map(category => (
              <button
                key={category}
                className={selectedCategory === category ? communityStyles.activeCategory : ''}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Topics' : category}
              </button>
            ))}
          </div>

          <div className={communityStyles.topicsList}>
            {filteredTopics.length === 0 ? (
              <div className={communityStyles.emptyState}>
                <div className={communityStyles.emptyIcon}>💬</div>
                <h3>No topics yet in this category</h3>
                <p>Be the first to start a conversation!</p>
                <button
                  className={communityStyles.newTopicBtn}
                  onClick={() => window.open('https://mysuccessplus.com/community/new-topic', '_blank')}
                >
                  Start a Discussion
                </button>
              </div>
            ) : (
              filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className={`${communityStyles.topicCard} ${topic.isPinned ? communityStyles.pinnedTopic : ''}`}
                  onClick={() => window.open(`https://mysuccessplus.com/community/topic/${topic.id}`, '_blank')}
                >
                  {topic.isPinned && <div className={communityStyles.pinnedBadge}>📌 Pinned</div>}
                  <div className={communityStyles.topicMain}>
                    <div className={communityStyles.topicAuthor}>
                      <img
                        src={topic.authorAvatar || '/default-avatar.png'}
                        alt={topic.author}
                        className={communityStyles.avatar}
                      />
                      <div>
                        <h3>{topic.title}</h3>
                        <div className={communityStyles.topicMeta}>
                          <span className={communityStyles.category}>{topic.category}</span>
                          <span>by {topic.author}</span>
                          <span>{topic.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={communityStyles.topicStats}>
                    <div className={communityStyles.statItem}>
                      <span className={communityStyles.statNumber}>{topic.replies}</span>
                      <span className={communityStyles.statText}>replies</span>
                    </div>
                    <div className={communityStyles.statItem}>
                      <span className={communityStyles.statNumber}>{topic.views}</span>
                      <span className={communityStyles.statText}>views</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={communityStyles.communityFeatures}>
            <h2>Community Features</h2>
            <div className={communityStyles.featuresGrid}>
              <div className={communityStyles.featureCard}>
                <span className={communityStyles.featureIcon}>🎯</span>
                <h3>Accountability Groups</h3>
                <p>Join small groups focused on specific goals and keep each other on track.</p>
                <button onClick={() => window.open('https://mysuccessplus.com/community/accountability', '_blank')}>
                  Find a Group →
                </button>
              </div>
              <div className={communityStyles.featureCard}>
                <span className={communityStyles.featureIcon}>🏆</span>
                <h3>Success Stories</h3>
                <p>Share your wins and celebrate the achievements of fellow members.</p>
                <button onClick={() => window.open('https://mysuccessplus.com/community/success-stories', '_blank')}>
                  Read Stories →
                </button>
              </div>
              <div className={communityStyles.featureCard}>
                <span className={communityStyles.featureIcon}>💼</span>
                <h3>Expert Office Hours</h3>
                <p>Get direct access to industry experts during live Q&A sessions.</p>
                <button onClick={() => window.open('https://mysuccessplus.com/community/office-hours', '_blank')}>
                  View Schedule →
                </button>
              </div>
              <div className={communityStyles.featureCard}>
                <span className={communityStyles.featureIcon}>🤝</span>
                <h3>Networking Hub</h3>
                <p>Connect with entrepreneurs and professionals in your industry.</p>
                <button onClick={() => window.open('https://mysuccessplus.com/community/networking', '_blank')}>
                  Start Networking →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
