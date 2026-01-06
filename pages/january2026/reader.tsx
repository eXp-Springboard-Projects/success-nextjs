import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from './reader.module.css';

export default function January2026Reader() {
  const router = useRouter();

  // PDF URL for the digital magazine
  const pdfUrl = '/magazines/january2026-digital.pdf';
  const coverImageUrl = '/images/january2026-cover.jpg';

  return (
    <>
      <Head>
        <title>January/February 2026 Digital Edition - SUCCESS Magazine</title>
        <meta
          name="description"
          content="Read the January 2026 Digital Edition of SUCCESS Magazine featuring Amy Porterfield - Your Ultimate Guide to Reinvention"
        />
        <meta property="og:title" content="January 2026 Digital Edition - SUCCESS Magazine" />
        <meta property="og:description" content="Amy Porterfield: Your Ultimate Guide to Reinvention - The Multimillion-Dollar Pivot" />
        <meta property="og:image" content="https://www.success.com/images/january2026-cover.jpg" />
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
          <h1 className={styles.title}>January 2026</h1>
          <div className={styles.subtitle}>SUCCESS Magazine Digital Edition - Your Ultimate Guide to Reinvention</div>
        </div>

        <div className={styles.flipbookWrapper}>
          <iframe
            src={pdfUrl}
            className={styles.flipbookIframe}
            title="SUCCESS Magazine - January 2026 Digital Edition"
            allowFullScreen
          />
        </div>
      </div>
    </>
  );
}
