import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import { supabaseAdmin } from '../../lib/supabase';
import { ContentPillar, getContentPillarLabel } from '../../lib/types';
import { useState } from 'react';
import styles from './AuthorPage.module.css';
import { User, Linkedin, Twitter, Facebook, Globe } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  photo?: string;
  title?: string;
  socialLinkedin?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  website?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  contentPillar?: ContentPillar;
  publishedAt?: string;
  readTime?: number;
}

interface AuthorPageProps {
  author: Author;
  posts: Post[];
  totalPosts: number;
}

export default function AuthorPage({ author, posts, totalPosts }: AuthorPageProps) {
  const router = useRouter();
  const [selectedPillar, setSelectedPillar] = useState<ContentPillar | 'all'>('all');

  if (router.isFallback) {
    return <Layout><div style={{ padding: '4rem 2rem', textAlign: 'center' }}><p>Loading...</p></div></Layout>;
  }

  const filteredPosts = selectedPillar === 'all' ? posts : posts.filter(post => post.contentPillar === selectedPillar);
  const availablePillars = Array.from(new Set(posts.map(post => post.contentPillar).filter(Boolean))) as ContentPillar[];

  return (
    <Layout>
      <Head>
        <title>{author.name} - SUCCESS Magazine</title>
        <meta name="description" content={author.bio || `Articles by ${author.name}`} />
        <link rel="canonical" href={`https://www.success.com/author/${author.slug}`} />
      </Head>

      <div className={styles.container}>
        <div className={styles.authorHeader}>
          <div className={styles.authorPhoto}>
            {author.photo ? <img src={author.photo} alt={author.name} /> : <div className={styles.photoPlaceholder}><User size={64} /></div>}
          </div>

          <div className={styles.authorInfo}>
            <h1>{author.name}</h1>
            {author.title && <p className={styles.title}>{author.title}</p>}
            {author.bio && <p className={styles.bio}>{author.bio}</p>}

            {(author.socialLinkedin || author.socialTwitter || author.socialFacebook || author.website) && (
              <div className={styles.socialLinks}>
                {author.website && <a href={author.website} target="_blank" rel="noopener noreferrer"><Globe size={20} /></a>}
                {author.socialLinkedin && <a href={author.socialLinkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>}
                {author.socialTwitter && <a href={author.socialTwitter} target="_blank" rel="noopener noreferrer"><Twitter size={20} /></a>}
                {author.socialFacebook && <a href={author.socialFacebook} target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>}
              </div>
            )}

            <div className={styles.stats}><span>{totalPosts} {totalPosts === 1 ? 'Article' : 'Articles'}</span></div>
          </div>
        </div>

        {availablePillars.length > 1 && (
          <div className={styles.filterSection}>
            <h3>Filter by Topic</h3>
            <div className={styles.filterButtons}>
              <button onClick={() => setSelectedPillar('all')} className={selectedPillar === 'all' ? styles.filterButtonActive : styles.filterButton}>All Articles</button>
              {availablePillars.map((pillar) => (
                <button key={pillar} onClick={() => setSelectedPillar(pillar)} className={selectedPillar === pillar ? styles.filterButtonActive : styles.filterButton}>
                  {getContentPillarLabel(pillar)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.articlesSection}>
          <h2>{selectedPillar === 'all' ? `All Articles by ${author.name}` : `${getContentPillarLabel(selectedPillar)} Articles`}</h2>

          {filteredPosts.length === 0 ? (
            <div className={styles.emptyState}><p>No articles found{selectedPillar !== 'all' ? ' in this category' : ''}.</p></div>
          ) : (
            <div className={styles.articlesGrid}>
              {filteredPosts.map((post) => (
                <PostCard key={post.id} id={post.id} title={post.title} slug={post.slug} excerpt={post.excerpt || ''} featuredImage={post.featuredImage} date={post.publishedAt || ''} author={author.name} readTime={post.readTime} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const supabase = supabaseAdmin();

  try {
    const { data: author, error: authorError } = await supabase.from('authors').select('*').eq('slug', slug).eq('isActive', true).single();
    if (authorError || !author) return { notFound: true };

    const { data: posts } = await supabase.from('posts').select('id, title, slug, excerpt, featuredImage, contentPillar, publishedAt, readTime').eq('customAuthorId', author.id).eq('status', 'PUBLISHED').order('publishedAt', { ascending: false });

    return { props: { author, posts: posts || [], totalPosts: posts?.length || 0 } };
  } catch (error) {
    return { notFound: true };
  }
};
