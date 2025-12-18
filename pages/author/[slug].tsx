import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import styles from './Author.module.css';
import { fetchWordPressData } from '../../lib/wordpress';
import { decodeHtmlEntities, decodeHtmlContent } from '../../lib/htmlDecode';

type AuthorPageProps = {
  author: any;
  posts: any[];
};

export default function AuthorPage({ author, posts }: AuthorPageProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  if (!author) {
    return (
      <Layout>
        <div className={styles.error}>Author not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Author Hero */}
      <div className={styles.authorHero}>
        <div className={styles.heroContent}>
          {author.avatar_urls && (
            <img
              src={author.avatar_urls['96']}
              alt={author.name}
              className={styles.avatar}
            />
          )}
          <h1 className={styles.authorName}>{decodeHtmlEntities(author.name)}</h1>
          {author.description && (
            <div
              className={styles.authorBio}
              dangerouslySetInnerHTML={{ __html: decodeHtmlContent(author.description) }}
            />
          )}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{posts.length}</span>
              <span className={styles.statLabel}>{posts.length === 1 ? 'Article' : 'Articles'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Section */}
      {posts.length > 0 ? (
        <div className={styles.postsSection}>
          <div className={styles.postsContainer}>
            <h2 className={styles.postsTitle}>Latest Articles</h2>
            <div className={styles.postsGrid}>
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.noArticles}>
          <p>No articles published yet.</p>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const authors = await fetchWordPressData(`users?slug=${params.slug}`);
    const author = authors[0];

    if (!author) {
      return {
        notFound: true,
      };
    }

    const posts = await fetchWordPressData(
      `posts?author=${author.id}&_embed&per_page=20`
    );

    return {
      props: {
        author,
        posts,
      }
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
