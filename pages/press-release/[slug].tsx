import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import styles from './PressRelease.module.css';
import { fetchWordPressData } from '../../lib/wordpress';
import { decodeHtmlEntities, decodeHtmlContent } from '../../lib/htmlDecode';

type PressReleasePageProps = {
  pressRelease: any;
};

export default function PressReleasePage({ pressRelease }: PressReleasePageProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  if (!pressRelease) {
    return (
      <Layout>
        <div className={styles.error}>Press release not found</div>
      </Layout>
    );
  }

  const featuredImageUrl = pressRelease._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const title = decodeHtmlEntities(pressRelease.title?.rendered || 'Press Release');

  return (
    <Layout>
      <SEO
        title={`${title} | SUCCESS`}
        description={pressRelease.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 160) || ''}
        url={`https://www.success.com/press-release/${pressRelease.slug}`}
        type="article"
        image={featuredImageUrl}
      />

      <article className={styles.article}>
        <div className={styles.breadcrumb}>
          <a href="/">Home</a>
          <span className={styles.separator}>›</span>
          <a href="/press-releases">Press Releases</a>
          <span className={styles.separator}>›</span>
          <span>{title}</span>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>

          <div className={styles.meta}>
            <time className={styles.date}>
              {new Date(pressRelease.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>

        {featuredImageUrl && (
          <div className={styles.featuredImage}>
            <img src={featuredImageUrl} alt={title} />
          </div>
        )}

        <div className={styles.content}>
          {pressRelease.content?.rendered && (
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: decodeHtmlContent(pressRelease.content.rendered) }}
            />
          )}
        </div>

        <footer className={styles.footer}>
          <a href="/press-releases" className={styles.backLink}>
            ← Back to Press Releases
          </a>
        </footer>
      </article>
    </Layout>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const pressReleases = await fetchWordPressData(`press-releases?slug=${params.slug}&_embed`);
    const pressRelease = pressReleases[0];

    if (!pressRelease) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        pressRelease,
      }
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
