import styles from './MagazineHero.module.css';
import { decodeHtmlEntities } from '../lib/htmlDecode';
import Image from 'next/image';

const phpunserialize = require('phpunserialize');

export default function MagazineHero({ magazine }) {
  if (!magazine) {
    return (
      <section className={styles.hero}>
        <div className={styles.overlay}>
          <div className={styles.header}>
            <span className={styles.headerText}>Inside the Magazine</span>
          </div>
          <div className={styles.loadingState}>
            <p>Loading magazine content...</p>
          </div>
        </div>
      </section>
    );
  }

  const heroImage = magazine._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
                    magazine.meta_data?.['image-for-listing-page']?.[0] ||
                    '';
  const title = magazine.meta_data?.['magazine-banner-heading']?.[0] || magazine.title?.rendered || '';
  const date = magazine.meta_data?.['magazine-published-text']?.[0] || '';
  const description = magazine.meta_data?.['magazine-banner-description']?.[0] || '';
  const descriptionLink = magazine.meta_data?.['magazine-banner-description-link']?.[0] || '';

  // Parse related articles if available using proper PHP unserialize
  const relatedDataRaw = magazine.meta_data?.['magazine-banner-related-data']?.[0];
  let sideFeatures = [];

  if (relatedDataRaw) {
    try {
      const parsed = phpunserialize(relatedDataRaw);

      if (parsed && typeof parsed === 'object') {
        // Extract item-0 and item-1 from the unserialized data
        ['item-0', 'item-1'].forEach(key => {
          if (parsed[key]) {
            const item = parsed[key];
            sideFeatures.push({
              title: item['banner-related-data-title'] || '',
              description: item['banner-related-data-description'] || '',
              link: item['banner-related-data-link'] || ''
            });
          }
        });
      }
    } catch (e) {
      // Fallback to regex parsing if phpunserialize fails
      try {
        const item0Match = relatedDataRaw.match(/item-0.*?banner-related-data-title";s:\d+:"([^"]+)".*?banner-related-data-description";s:\d+:"([^"]+)".*?banner-related-data-link";s:\d+:"([^"]+)"/);
        const item1Match = relatedDataRaw.match(/item-1.*?banner-related-data-title";s:\d+:"([^"]+)".*?banner-related-data-description";s:\d+:"([^"]+)".*?banner-related-data-link";s:\d+:"([^"]+)"/);

        if (item0Match) {
          sideFeatures.push({ title: item0Match[1], description: item0Match[2], link: item0Match[3] });
        }
        if (item1Match) {
          sideFeatures.push({ title: item1Match[1], description: item1Match[2], link: item1Match[3] });
        }
      } catch (regexError) {
      }
    }
  }

  return (
    <section className={styles.hero} aria-label="Inside the Magazine">
      <div className={styles.overlay}>
        <div className={styles.header}>
          <span className={styles.headerText}>Inside the Magazine</span>
        </div>
        <div className={styles.contentGrid}>
          <div className={styles.mainFeature}>
            <p className={styles.subheading}>{magazine.slug?.replace(/-/g, ' ').toUpperCase() || 'The Legacy Issue'}</p>
            <p className={styles.date} dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(date) }} />
            <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(title) }} />
            {descriptionLink ? (
              <a
                href={descriptionLink}
                className={styles.descriptionLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read more about ${decodeHtmlEntities(title)}`}
              >
                <p className={styles.description} dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(description) }} />
              </a>
            ) : (
              <p className={styles.description} dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(description) }} />
            )}
          </div>
          <div className={styles.sideFeatures}>
            {sideFeatures.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                {feature.link ? (
                  <a
                    href={feature.link}
                    className={styles.featureLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read article: ${decodeHtmlEntities(feature.title)}`}
                  >
                    <h3 dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(feature.title) }} />
                    <p dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(feature.description) }} />
                  </a>
                ) : (
                  <>
                    <h3 dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(feature.title) }} />
                    <p dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(feature.description) }} />
                  </>
                )}
              </div>
            ))}
            <p className={styles.subscribeText}>
              Subscribe now to enjoy these and other exclusive featured content!
            </p>
          </div>
        </div>
      </div>
      {heroImage && (
        <div className={styles.heroImage}>
          <Image
            src={heroImage}
            alt={title || 'Magazine Cover'}
            fill
            sizes="(max-width: 992px) 100vw, 55vw"
            style={{ objectFit: 'cover', objectPosition: 'center center' }}
            priority
          />
        </div>
      )}
    </section>
  );
}