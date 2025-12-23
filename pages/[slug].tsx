import { GetStaticPaths, GetStaticProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import parse from 'html-react-parser';
import styles from './DynamicPage.module.css';
import { fetchWordPressData } from '../lib/wordpress';
import { canAccessContent } from '../lib/access-control';
// Import blog post component
import PostPage from './blog/[slug]';

const prisma = new PrismaClient();

interface DynamicPageProps {
  page: {
    id: string;
    title: string;
    content: string;
    slug: string;
    seoTitle: string | null;
    seoDescription: string | null;
    featuredImage: string | null;
    featuredImageAlt: string | null;
    publishedAt: string;
    updatedAt: string;
  } | null;
  post?: any;
  relatedPosts?: any[];
  hasAccess?: boolean;
  isPost?: boolean;
}

export default function DynamicPage({ page, post, relatedPosts, hasAccess, isPost }: DynamicPageProps) {
  // If this is a blog post, render the blog post component
  if (isPost && post) {
    return <PostPage post={post} relatedPosts={relatedPosts || []} hasAccess={hasAccess || true} />;
  }

  // Otherwise render as a page
  if (!page) {
    return null;
  }

  return (
    <Layout>
      <SEO
        title={page.seoTitle || page.title}
        description={page.seoDescription || ''}
        url={`https://www.success.com/${page.slug}`}
        image={page.featuredImage || undefined}
      />

      <article className={styles.article}>
        {/* Featured Image */}
        {page.featuredImage && (
          <div className={styles.featuredImage}>
            <img
              src={page.featuredImage}
              alt={page.featuredImageAlt || page.title}
              className={styles.featuredImg}
            />
          </div>
        )}

        {/* Page Title */}
        <header className={styles.header}>
          <h1 className={styles.title}>{page.title}</h1>
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          {parse(page.content)}
        </div>

        {/* Last Updated */}
        <footer className={styles.footer}>
          <p className={styles.updated}>
            Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </footer>
      </article>
    </Layout>
  );
}

export async function getServerSideProps({ params, req, res }: any) {
  const slug = params?.slug as string;
  let page = null;

  // Try to find a Page in the database (but don't fail if database is down)
  try {
    page = await prisma.pages.findFirst({
      where: {
        slug: slug,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        seoTitle: true,
        seoDescription: true,
        featuredImage: true,
        featuredImageAlt: true,
        publishedAt: true,
        updatedAt: true,
      }
    });

    await prisma.$disconnect();
  } catch (dbError: any) {
    console.log(`[Dynamic Page] Database error for "${slug}", will try WordPress:`, dbError.message);
    // If database fails, we'll fall through to WordPress fetch below
    page = null;
  }

  try {
    if (page) {
      // Serialize dates
      const serializedPage = {
        ...page,
        publishedAt: page.publishedAt?.toISOString() || new Date().toISOString(),
        updatedAt: page.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return {
        props: {
          page: serializedPage,
          isPost: false
        }
      };
    }

    // If no Page found, try to fetch from WordPress as a blog post
    const posts = await fetchWordPressData(`posts?slug=${slug}&_embed`);
    const post = posts[0];

    if (!post) {
      return { notFound: true };
    }

    // Fetch related posts from the same category
    const categoryId = post._embedded?.['wp:term']?.[0]?.[0]?.id;
    let relatedPosts = [];

    if (categoryId) {
      const related = await fetchWordPressData(
        `posts?categories=${categoryId}&_embed&per_page=3&exclude=${post.id}`
      );
      relatedPosts = related;
    }

    // Check access for premium content (using server-side session check)
    let hasAccess = true;
    const isPremium = post.isPremium || post.meta?.isPremium || false;

    if (isPremium) {
      // For SSG, we can't check session here, so we default to false
      // The client-side component will handle the actual access check
      hasAccess = false;
    }

    return {
      props: {
        page: null,
        post,
        relatedPosts,
        hasAccess,
        isPost: true
      }
    };
  } catch (error: any) {
    console.error(`[Dynamic Page] Error fetching "${slug}":`, error);
    return {
      notFound: true,
    };
  }
};
