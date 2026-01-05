import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from './reader.module.css';

export default function January2026Reader() {
  const router = useRouter();

  // Flipbook embed URL - to be updated with actual URL when available
  const flipbookUrl = 'https://read.dmtmag.com/i/1555634-jan-feb-2026/0';

  return (
    <>
      <Head>
        <title>January/February 2026 Digital Edition - SUCCESS Magazine</title>
        <meta
          name="description"
          content="Read the January/February 2026 issue of SUCCESS Magazine featuring Dean & Lisa Graziosi on The Power of Partnership in Business & Life"
        />
        <meta property="og:title" content="January/February 2026 - SUCCESS Magazine" />
        <meta property="og:description" content="Dean & Lisa Graziosi: The Power of Partnership in Business & Life" />
        <meta property="og:image" content="https://successcom.wpenginepowered.com/wp-content/uploads/2025/12/SM26_JAN-FEB-_-COVER-_-DEAN-LISA-GRAZIOSI_NO-BARCODE_FLAT-scaled.jpg" />
        <meta property="og:type" content="article" />
      </Head>

      <div className={styles.readerContainer}>
        <div className={styles.readerHeader}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/magazine')}
          >
            ← Back to Magazine
          </button>
          <h1 className={styles.title}>January/February 2026</h1>
          <div className={styles.subtitle}>SUCCESS Magazine - The Leadership Issue</div>
        </div>

        <div className={styles.flipbookWrapper}>
          <iframe
            src={flipbookUrl}
            className={styles.flipbookIframe}
            title="SUCCESS Magazine - January/February 2026"
            allowFullScreen
            allow="fullscreen"
          />
        </div>
      </div>
    </>
  );
}
