import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { supabaseAdmin } from '../../lib/supabase';

interface Block {
  id: string;
  type: 'hero' | 'text' | 'image' | 'form' | 'cta';
  content: any;
}

interface LandingPageProps {
  page: {
    id: string;
    title: string;
    slug: string;
    content: Block[];
    meta_title: string;
    meta_description: string;
    template: string;
  };
}

export default function LandingPage({ page }: LandingPageProps) {
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'hero':
        return (
          <section key={block.id} style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {block.content.heading}
              </h1>
              <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
                {block.content.subheading}
              </p>
              <a
                href={block.content.buttonUrl}
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  background: 'white',
                  color: '#667eea',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                }}
              >
                {block.content.buttonText}
              </a>
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={block.id} style={{ padding: '3rem 2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.125rem', lineHeight: 1.8 }}>
              {block.content.text}
            </div>
          </section>
        );

      case 'image':
        return (
          <section key={block.id} style={{ padding: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
              {block.content.url && (
                <img
                  src={block.content.url}
                  alt={block.content.alt}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.5rem' }}
                />
              )}
              {block.content.caption && (
                <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {block.content.caption}
                </p>
              )}
            </div>
          </section>
        );

      case 'form':
        return (
          <section key={block.id} style={{ padding: '3rem 2rem', background: '#f9fafb' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{
                padding: '2rem',
                background: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
              }}>
                <p>Form embed placeholder (Form ID: {block.content.formId})</p>
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={block.id} style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: '#f9fafb',
          }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                {block.content.text}
              </h2>
              <a
                href={block.content.buttonUrl}
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                }}
              >
                {block.content.buttonText}
              </a>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const getTemplateStyles = () => {
    switch (page.template) {
      case 'full-width':
        return { maxWidth: '100%' };
      case 'with-sidebar':
        return { maxWidth: '1400px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' };
      default:
        return { maxWidth: '1200px' };
    }
  };

  return (
    <>
      <Head>
        <title>{page.meta_title || page.title}</title>
        <meta name="description" content={page.meta_description || ''} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'white' }}>
        <main style={{ ...getTemplateStyles(), margin: '0 auto' }}>
          {page.content.map(block => renderBlock(block))}
        </main>

        <footer style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}>
          <p>&copy; {new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Return empty paths - landing pages will be generated on-demand
  // The landing_pages table may not exist yet
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  try {
    const supabase = supabaseAdmin();
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .limit(1);

    if (error || !pages || pages.length === 0) {
      return { notFound: true };
    }

    // Track view (ignore errors)
    void supabase
      .rpc('increment_landing_page_views', { page_slug: slug });

    return {
      props: {
        page: pages[0],
      },
      revalidate: 600,
    };
  } catch (error) {
    // Table doesn't exist or other error
    return { notFound: true };
  }
};
