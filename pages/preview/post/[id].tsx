/**
 * Post Preview Page
 * Displays draft/unpublished posts as they will appear on frontend
 * Only accessible to authenticated users
 */

import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import styles from '../../../styles/BlogPost.module.css';

interface PreviewPostProps {
  post: any;
  isPreview: boolean;
}

export default function PreviewPost({ post, isPreview }: PreviewPostProps) {
  if (!post) {
    return (
      <Layout>
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h1>Post Not Found</h1>
          <p>This preview is not available.</p>
        </div>
      </Layout>
    );
  }

  const publishDate = new Date(post.createdAt || Date.now());
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Layout>
      <Head>
        <title>{post.title} - PREVIEW | SUCCESS Magazine</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Preview Banner */}
      {isPreview && (
        <div style={{
          background: '#ff6b35',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '14px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
          🔍 PREVIEW MODE - This is how your post will appear on the website
          <Link href={`/admin/posts/${post.id}/edit`} style={{
            marginLeft: '20px',
            color: 'white',
            textDecoration: 'underline'
          }}>
            ← Back to Editor
          </Link>
        </div>
      )}

      <article className={styles.article}>
        {/* Featured Image */}
        {post.featuredImage && (
          <div className={styles.featuredImage}>
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || post.title}
              width={1200}
              height={600}
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}

        {/* Article Header */}
        <div className={styles.header}>
          {post.categories && post.categories.length > 0 && (
            <div className={styles.categories}>
              {post.categories.map((cat: any) => (
                <span key={cat.id} className={styles.category}>
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h1 className={styles.title}>{post.title}</h1>

          {post.excerpt && (
            <p className={styles.excerpt}>{post.excerpt}</p>
          )}

          <div className={styles.meta}>
            <span className={styles.author}>
              By {post.author?.name || 'Staff Writer'}
            </span>
            <span className={styles.date}>{formattedDate}</span>
            {post.status !== 'publish' && (
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {post.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio (if available) */}
        {post.author && (
          <div className={styles.authorBio}>
            <div className={styles.authorInfo}>
              <h3>{post.author.name}</h3>
              {post.author.bio && <p>{post.author.bio}</p>}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const session = await getSession(context);

  // Require authentication for preview
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  try {
    // Try to fetch from local database first
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts/${id}`);

    if (res.ok) {
      const post = await res.json();
      return {
        props: {
          post,
          isPreview: true,
        },
      };
    }

    // If not in database, try WordPress API
    const wpApiUrl = process.env.WORDPRESS_API_URL || 'https://successcom.wpenginepowered.com/wp-json/wp/v2';
    const wpRes = await fetch(`${wpApiUrl}/posts/${id}?_embed=true`);

    if (wpRes.ok) {
      const wpPost = await wpRes.json();

      // Transform WordPress data to our format
      const post = {
        id: wpPost.id,
        title: wpPost.title.rendered,
        content: wpPost.content.rendered,
        excerpt: wpPost.excerpt?.rendered?.replace(/<[^>]*>/g, ''),
        slug: wpPost.slug,
        status: wpPost.status,
        featuredImage: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url,
        featuredImageAlt: wpPost._embedded?.['wp:featuredmedia']?.[0]?.alt_text,
        createdAt: wpPost.date,
        author: {
          name: wpPost._embedded?.author?.[0]?.name,
          bio: wpPost._embedded?.author?.[0]?.description,
        },
        categories: wpPost._embedded?.['wp:term']?.[0]?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
      };

      return {
        props: {
          post,
          isPreview: true,
        },
      };
    }

    return {
      props: {
        post: null,
        isPreview: true,
      },
    };
  } catch (error) {
    return {
      props: {
        post: null,
        isPreview: true,
      },
    };
  }
};
