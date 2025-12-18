import Layout from '../../components/Layout';
import styles from './Archive.module.css';
import { fetchWordPressData } from '../../lib/wordpress';

type ArchivePageProps = {
  magazines: any[];
};

export default function ArchivePage({ magazines }: ArchivePageProps) {
  return (
    <Layout>
      <div className={styles.archive}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Magazine Archive</h1>
          <p className={styles.subtitle}>
            Explore over 125 years of inspiration, motivation, and practical advice
          </p>
        </header>

        <section className={styles.content}>
          <div className={styles.grid}>
            {magazines.map((magazine) => {
              const featuredImage = magazine._embedded?.['wp:featuredmedia']?.[0];
              const publishedText = Array.isArray(magazine.meta_data)
                ? magazine.meta_data?.find(
                    (meta: any) => meta['magazine-published-text']
                  )?.['magazine-published-text']?.[0]
                : null;

              return (
                <div key={magazine.id} className={styles.card}>
                  {featuredImage && (
                    <div className={styles.imageWrapper}>
                      <img
                        src={featuredImage.source_url}
                        alt={magazine.title.rendered}
                        className={styles.image}
                      />
                    </div>
                  )}
                  <div className={styles.cardContent}>
                    {publishedText && (
                      <span className={styles.date}>{publishedText}</span>
                    )}
                    <h2 className={styles.magazineTitle}>{magazine.title.rendered}</h2>
                    <a href={magazine.link} className={styles.viewButton}>
                      View Issue
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const magazines = await fetchWordPressData('magazines?per_page=50&_embed');

    return {
      props: {
        magazines,
      }
    };
  } catch (error) {
    return {
      props: {
        magazines: [],
      }
    };
  }
}
