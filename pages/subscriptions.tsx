import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './Subscribe.module.css';

const magazineCovers = [
  { src: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/10/SM_NovDec2024_Cover.jpg', alt: 'SUCCESS Magazine - Tony Robbins' },
  { src: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/08/SM_SeptOct2024_Cover.jpg', alt: 'SUCCESS Magazine - Eva Longoria' },
  { src: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/06/SM_JulyAug2024_Cover.jpg', alt: 'SUCCESS Magazine - Daymond John' },
  { src: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/04/SM_MayJun2024_Cover.jpg', alt: 'SUCCESS Magazine - Mel Robbins' },
];

export default function SubscriptionsPage() {
  return (
    <Layout>
      <SEO
        title="Subscribe to SUCCESS Magazine"
        description="Subscribe to SUCCESS Magazine - Since 1897, the definitive source for inspiration."
        url="https://www.success.com/subscriptions"
      />
      <div className={styles.subscriptionsPage}>
        <section className={styles.magazineShowcase}>
          <div className={styles.magazineGrid}>
            {magazineCovers.map((cover, index) => (
              <div key={index} className={styles.magazineCover}>
                <img src={cover.src} alt={cover.alt} className={styles.coverImage} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.heroContent}>
          <h1 className={styles.heroTitle}><em>Bring the Legacy Home.</em></h1>
          <div className={styles.heroText}>
            <p>Since 1897, SUCCESS magazine has been the definitive source for inspiration, achievement and personal growth.</p>
            <p>Every issue delivers timeless lessons and modern strategies from the world's top thought leaders, entrepreneurs and visionaries—empowering you to design a life of purpose, prosperity and fulfillment.</p>
            <p>Subscribe to SUCCESS magazine and get every issue delivered straight to your door—filled with expert advice on business, money, mindset and leadership.</p>
            <p className={styles.ctaText}>Start your subscription today—step into a community built for growth, ambition and impact.</p>
          </div>
          <p className={styles.tagline}><em>Stay connected to the ideas that move you forward.</em></p>
        </section>

        <section className={styles.subscribeSection}>
          <h2 className={styles.subscribeTitle}>Subscribe Now</h2>
          <div className={styles.iframeContainer}>
            <iframe src="https://subscribe.success.com/SCC/?f=paid" title="Subscribe" className={styles.subscribeIframe} />
          </div>
        </section>
      </div>
    </Layout>
  );
}
