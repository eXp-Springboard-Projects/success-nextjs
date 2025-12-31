import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './Subscribe.module.css';

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
          <div className={styles.magazineBanner}>
            <img 
              src="/images/magazine-covers.webp" 
              alt="SUCCESS Magazine Covers featuring Tony Robbins, Eva Longoria, Daymond John, and Mel Robbins" 
              className={styles.bannerImage} 
            />
          </div>
        </section>

        <section className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Bring the Legacy Home.</h1>
          <div className={styles.heroText}>
            <p>Since 1897, <em>SUCCESS</em> magazine has been the definitive source for inspiration, achievement and personal growth.</p>
            <p>Every issue delivers timeless lessons and modern strategies from the world's top thought leaders, entrepreneurs and visionaries—empowering you to design a life of purpose, prosperity and fulfillment.</p>
            <p>Subscribe to <em>SUCCESS</em> magazine and get every issue delivered straight to your door—filled with expert advice on business, money, mindset and leadership.</p>
            <p className={styles.ctaText}>Start your subscription today—step into a community built for growth, ambition and impact.</p>
          </div>
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
