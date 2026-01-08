/**
 * Social Media Dashboard
 * Main overview page for social media management
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSocialAccounts } from '@/hooks/social/useSocialAccounts';
import { useSocialPosts } from '@/hooks/social/useSocialPosts';
import { PLATFORM_COLORS } from '@/types/social';
import styles from './SocialMedia.module.css';
import { requireSocialMediaAuth } from '@/lib/adminAuth';

export default function SocialMediaDashboard() {
  const { accounts } = useSocialAccounts();
  const { posts } = useSocialPosts({ autoFetch: true });

  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPosts = posts.filter((p) => p.status === 'draft');

  const nextPost = scheduledPosts
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const quickActions = [
    {
      title: 'Create Post',
      description: 'Schedule a new social media post',
      href: '/admin/social-media/composer',
      icon: '✍️',
      color: '#667eea',
    },
    {
      title: 'Calendar View',
      description: 'See all scheduled posts on a calendar',
      href: '/admin/social-media/calendar',
      icon: '📅',
      color: '#8b5cf6',
    },
    {
      title: 'Queue Management',
      description: 'Reorder and manage your posting queue',
      href: '/admin/social-media/queue',
      icon: '📋',
      color: '#10b981',
    },
    {
      title: 'Connected Accounts',
      description: 'Manage your social media connections',
      href: '/admin/social-media/accounts',
      icon: '🔗',
      color: '#3b82f6',
    },
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Social Media Manager</h1>
            <p>Schedule and manage your social media posts across all platforms</p>
          </div>
          <Link href="/admin/social-media/composer" className={styles.primaryButton}>
            ✍️ Create Post
          </Link>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#667eea' }}>🔗</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{accounts.length}</div>
              <div className={styles.statLabel}>Connected Accounts</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#10b981' }}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{scheduledPosts.length}</div>
              <div className={styles.statLabel}>Scheduled Posts</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#3b82f6' }}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{publishedPosts.length}</div>
              <div className={styles.statLabel}>Published Posts</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#8b5cf6' }}>📝</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{draftPosts.length}</div>
              <div className={styles.statLabel}>Drafts</div>
            </div>
          </div>
        </div>

        {nextPost && (
          <div className={styles.nextPostCard}>
            <h3>Next Scheduled Post</h3>
            <div className={styles.nextPostContent}>
              <div>
                <p className={styles.nextPostText}>{nextPost.content.substring(0, 100)}...</p>
                <p className={styles.nextPostTime}>
                  📅 {new Date(nextPost.scheduledAt).toLocaleString()}
                </p>
                <div className={styles.platformBadges}>
                  {nextPost.targetPlatforms.map((platform) => (
                    <span
                      key={platform}
                      className={styles.platformBadge}
                      style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.quickActionsSection}>
          <h2>Quick Actions</h2>
          <div className={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={styles.quickActionCard}
                style={{ borderLeftColor: action.color }}
              >
                <div className={styles.quickActionIcon}>{action.icon}</div>
                <div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.recentActivity}>
          <div className={styles.sectionHeader}>
            <h2>Recent Posts</h2>
          </div>

          <div className={styles.postsList}>
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className={styles.postItem}>
                <div className={styles.postContent}>
                  <p className={styles.postText}>{post.content.substring(0, 80)}...</p>
                  <div className={styles.postMeta}>
                    <span className={styles.statusBadge}>{post.status}</span>
                    <span className={styles.postDate}>
                      {new Date(post.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className={styles.emptyState}>
                <p>No posts yet. Create your first post to get started!</p>
                <Link href="/admin/social-media/composer" className={styles.primaryButton}>
                  Create Your First Post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireSocialMediaAuth;
