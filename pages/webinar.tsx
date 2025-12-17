import Layout from '../components/Layout';
import Head from 'next/head';
import styles from '../styles/Webinar.module.css';

export default function WebinarPage() {
  return (
    <Layout>
      <Head>
        <title>Exclusive Webinar - SUCCESS Magazine</title>
        <meta name="description" content="Join our exclusive webinar and discover strategies for success" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <a href="https://coaching.success.com" className={styles.backLink}>
            ← Back to Coaching
          </a>
        </div>

        <div className={styles.content}>
          <div className={styles.iframeWrapper}>
            <iframe
              src="https://event.webinarjam.com/g8o7wz/register/209gz6sl"
              width="100%"
              height="800"
              frameBorder="0"
              title="SUCCESS Webinar Registration"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
