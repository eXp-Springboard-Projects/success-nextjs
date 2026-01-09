import { GetStaticPaths, GetStaticProps } from 'next';
import { supabaseAdmin } from '../lib/supabase';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import parse from 'html-react-parser';
import styles from './DynamicPage.module.css';
import { fetchWordPressData } from '../lib/wordpress';
import { canAccessContent } from '../lib/access-control';
// Import blog post component
import PostPage from './blog/[slug]';

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
  let post = null;

  // Try to find a Page in the database first
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('id, title, content, slug, seoTitle, seoDescription, featuredImage, featuredImageAlt, publishedAt, updatedAt')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .single();

    if (!error && data) {
      page = data;
    }
  } catch (dbError: any) {
    // Page not found, continue
  }

  // If no Page found, try to find a Post in the database
  if (!page) {
    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'PUBLISHED')
        .single();

      if (!error && data) {
        // Found post in database - format it like a WordPress post
        post = {
          id: data.id,
          title: { rendered: data.title },
          content: { rendered: data.content },
          excerpt: { rendered: data.excerpt || '' },
          slug: data.slug,
          date: data.publishedAt || data.createdAt,
          modified: data.updatedAt,
          _embedded: {
            author: [{ name: data.authorName || 'Unknown' }],
            'wp:featuredmedia': data.featuredImage ? [{
              source_url: data.featuredImage,
              alt_text: data.featuredImageAlt || ''
            }] : [],
            'wp:term': [[], []] // Empty categories/tags for now
          }
        };
      }
    } catch (dbError: any) {
      // Post not found in database, will try WordPress
    }
  }

  try {
    if (page) {
      // Return database page
      return {
        props: {
          page: page,
          isPost: false
        }
      };
    }

    if (post) {
      // Return database post (formatted like WordPress)
      return {
        props: {
          page: null,
          post,
          relatedPosts: [],
          hasAccess: true,
          isPost: true
        }
      };
    }

    // If no Page or Post found in database, try WordPress PAGES first (like /daily-sms/)
    const wpPages = await fetchWordPressData(`pages?slug=${slug}&_embed`);
    const wpPage = wpPages?.[0];

    if (wpPage) {
      // WordPress page found - render it
      const formattedPage = {
        id: String(wpPage.id),
        title: wpPage.title?.rendered || wpPage.title || 'Untitled',
        content: wpPage.content?.rendered || wpPage.content || '',
        slug: wpPage.slug,
        seoTitle: wpPage.yoast_head_json?.title || wpPage.title?.rendered || null,
        seoDescription: wpPage.yoast_head_json?.description || wpPage.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() || null,
        featuredImage: wpPage._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        featuredImageAlt: wpPage._embedded?.['wp:featuredmedia']?.[0]?.alt_text || null,
        publishedAt: wpPage.date || new Date().toISOString(),
        updatedAt: wpPage.modified || new Date().toISOString(),
      };

      return {
        props: {
          page: formattedPage,
          isPost: false
        }
      };
    }

    // If no WordPress page found, try WordPress POSTS (blog posts)
    const wpPosts = await fetchWordPressData(`posts?slug=${slug}&_embed`);
    const wpPost = wpPosts?.[0];

    if (!wpPost) {
      return { notFound: true };
    }

    // Use wpPost instead of post for the rest of the logic
    post = wpPost;

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
