import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import styles from './Category.module.css';
import { fetchWordPressData } from '../../lib/wordpress';
import { decodeHtmlEntities } from '../../lib/htmlDecode';

type CategoryPageProps = {
  category: any;
  posts: any[];
  totalPages: number;
  currentPage: number;
};

export default function CategoryPage({ category, posts, totalPages, currentPage }: CategoryPageProps) {
  const router = useRouter();

  if (router.isFallback || !category) {
    return <Layout><div className={styles.loading}>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className={styles.container}>
        {/* Category Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{decodeHtmlEntities(category.name)}</h1>
            {category.description && (
              <p className={styles.description}>{decodeHtmlEntities(category.description)}</p>
            )}
            <div className={styles.postCount}>
              {category.count} {category.count === 1 ? 'Article' : 'Articles'}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className={styles.postsGrid}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            {currentPage > 1 && (
              <button
                onClick={() => router.push(`/category/${category.slug}?page=${currentPage - 1}`)}
                className={styles.paginationBtn}
              >
                ← Previous
              </button>
            )}

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => router.push(`/category/${category.slug}?page=${page}`)}
                  className={`${styles.pageNumber} ${page === currentPage ? styles.active : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            {currentPage < totalPages && (
              <button
                onClick={() => router.push(`/category/${category.slug}?page=${currentPage + 1}`)}
                className={styles.paginationBtn}
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }: any) {
  const { slug } = params;

  try {
    // Fetch category data
    const categories = await fetchWordPressData(`categories?slug=${slug}`);
    const category = categories[0];

    if (!category) {
      return { notFound: true };
    }

    // Fetch posts in this category
    const posts = await fetchWordPressData(
      `posts?categories=${category.id}&_embed&per_page=12`
    );

    return {
      props: {
        category,
        posts,
        totalPages: 1,
        currentPage: 1,
      }
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return { notFound: true };
  }
}
