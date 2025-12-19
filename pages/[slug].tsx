import { GetStaticPaths, GetStaticProps } from 'next';
import { PrismaClient } from '@prisma/client';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import parse from 'html-react-parser';
import styles from './DynamicPage.module.css';

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
}

export default function DynamicPage({ page }: DynamicPageProps) {
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

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // List of reserved slugs that have their own page files
    const reservedSlugs = [
      'login', 'register', 'account', 'advertise', 'about',
      'admin', 'api', 'blog', 'category', 'author', 'lp', 'pay',
      'press-release', 'dashboard', 'preview', 'success-plus',
      'signup', 'forgot-password', 'reset-password', 'speakers',
      'bestsellers', 'coaching', 'press', 'media-kit', 'press-releases'
    ];

    const pages = await prisma.pages.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { notIn: reservedSlugs }
      },
      select: { slug: true }
    });

    await prisma.$disconnect();

    return {
      paths: pages.map(p => ({ params: { slug: p.slug } })),
      fallback: 'blocking' // Enable ISR for new pages
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<DynamicPageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string;

    const page = await prisma.pages.findFirst({
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

    if (!page) {
      return {
        notFound: true,
      };
    }

    // Serialize dates
    const serializedPage = {
      ...page,
      publishedAt: page.publishedAt?.toISOString() || new Date().toISOString(),
      updatedAt: page.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return {
      props: {
        page: serializedPage
      },
      revalidate: 600 // Revalidate every 10 minutes (ISR)
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true,
    };
  }
};
