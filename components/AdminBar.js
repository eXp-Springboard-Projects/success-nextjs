import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AdminBar.module.css';

/**
 * Admin Bar - Shows edit button when logged in as admin
 * Appears at top of frontend pages for ADMIN/SUPER_ADMIN users
 */
export default function AdminBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [postId, setPostId] = useState(null);
  const [editUrl, setEditUrl] = useState(null);

  useEffect(() => {
    // Only show for admins
    if (status !== 'authenticated' || !session?.user?.role) {
      // Remove admin class when not logged in
      document.body.classList.remove('admin-logged-in');
      return;
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      // Remove admin class for non-admins
      document.body.classList.remove('admin-logged-in');
      return;
    }

    // Add admin class for styling adjustments
    if (!router.pathname.startsWith('/admin')) {
      document.body.classList.add('admin-logged-in');
    } else {
      document.body.classList.remove('admin-logged-in');
    }

    // Detect current page type and get edit URL
    const path = router.asPath;

    // Blog post: /blog/[slug] → /admin/posts/[id]/edit
    if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '').split('?')[0].split('#')[0];

      // Fetch post ID from slug
      fetch(`/api/posts?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]?.id) {
            setPostId(data[0].id);
            setEditUrl(`/admin/posts/${data[0].id}/edit`);
          }
        })
        .catch(() => {});
    }
    // Video: /video/[slug] → /admin/videos/[id]/edit
    else if (path.startsWith('/video/')) {
      const slug = path.replace('/video/', '').split('?')[0].split('#')[0];

      fetch(`/api/videos?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]?.id) {
            setEditUrl(`/admin/videos/${data[0].id}/edit`);
          }
        })
        .catch(() => {});
    }
    // Podcast: /podcast/[slug] → /admin/podcasts/[id]/edit
    else if (path.startsWith('/podcast/')) {
      const slug = path.replace('/podcast/', '').split('?')[0].split('#')[0];

      fetch(`/api/podcasts?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]?.id) {
            setEditUrl(`/admin/podcasts/${data[0].id}/edit`);
          }
        })
        .catch(() => {});
    }
    // Static page: /about → /admin/pages/about/edit
    else if (path.startsWith('/about') || path.startsWith('/magazine') || path.startsWith('/subscribe')) {
      const pageName = path.split('/')[1].split('?')[0].split('#')[0];
      setEditUrl(`/admin/pages/${pageName}/edit`);
    }
  }, [router.asPath, session, status]);

  // Don't show if not authenticated or not admin
  if (status !== 'authenticated' || !session?.user?.role) {
    return null;
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  // Don't show on admin pages
  if (router.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className={styles.adminBar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={styles.logo}>⚙️ SUCCESS CMS</span>
          <span className={styles.divider}>|</span>
          <span className={styles.userName}>
            {session.user.name || session.user.email}
          </span>
          <span className={styles.role}>({session.user.role})</span>
        </div>

        <div className={styles.right}>
          <Link href="/admin" className={styles.link}>
            📊 Dashboard
          </Link>

          {editUrl && (
            <Link href={editUrl} className={styles.editButton}>
              ✏️ Edit Page
            </Link>
          )}

          <Link href="/admin/posts/new" className={styles.link}>
            ➕ New Post
          </Link>
        </div>
      </div>
    </div>
  );
}
