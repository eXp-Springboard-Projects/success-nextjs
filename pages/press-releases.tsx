import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './PressReleases.module.css';
import { fetchWordPressData } from '../lib/wordpress';
import { decodeHtmlEntities } from '../lib/htmlDecode';

type PressRelease = {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  _embedded?: any;
};

type PressReleasesPageProps = {
  pressReleases: PressRelease[];
  totalPages: number;
};

export default function PressReleasesPage({ pressReleases, totalPages }: PressReleasesPageProps) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Layout>
      <SEO
        title="Press Releases | SUCCESS"
        description="Latest press releases and news from SUCCESS Magazine"
        url="https://www.success.com/press-releases"
        type="website"
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/press" className={styles.backLink}>
            ← Back to Press
          </Link>
          <h1 className={styles.title}>Press Releases</h1>
          <p className={styles.subtitle}>Latest news and announcements from SUCCESS</p>
        </header>

        <div className={styles.grid}>
          {pressReleases.map((release) => {
            const featuredImage = release._embedded?.['wp:featuredmedia']?.[0]?.source_url;

            return (
              <article key={release.id} className={styles.card}>
                {featuredImage && (
                  <a href={`/press-release/${release.slug}`} className={styles.imageLink}>
                    <img
                      src={featuredImage}
                      alt={decodeHtmlEntities(release.title.rendered)}
                      className={styles.image}
                    />
                  </a>
                )}

                <div className={styles.content}>
                  <time className={styles.date}>
                    {new Date(release.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>

                  <h2 className={styles.cardTitle}>
                    <a href={`/press-release/${release.slug}`}>
                      {decodeHtmlEntities(release.title.rendered)}
                    </a>
                  </h2>

                  {release.excerpt && (
                    <div
                      className={styles.excerpt}
                      dangerouslySetInnerHTML={{ __html: release.excerpt.rendered }}
                    />
                  )}

                  <a href={`/press-release/${release.slug}`} className={styles.readMore}>
                    Read More →
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className={styles.paginationButton}
              >
                ← Previous
              </button>
            )}

            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages && (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className={styles.paginationButton}
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

export async function getServerSideProps() {
  try {
    const pressReleases = await fetchWordPressData('press-releases?_embed&per_page=20');

    return {
      props: {
        pressReleases: pressReleases || [],
        totalPages: 1,
      }
    };
  } catch (error) {
    return {
      props: {
        pressReleases: [],
        totalPages: 1,
      }
    };
  }
}
