import Layout from '../components/Layout';
import styles from './Legal.module.css';
import { fetchWordPressData } from '../lib/wordpress';
import { decodeHtmlEntities, decodeHtmlContent } from '../lib/htmlDecode';

type PrivacyPageProps = {
  page: any;
};

export default function PrivacyPage({ page }: PrivacyPageProps) {
  return (
    <Layout>
      <div className={styles.legal}>
        <header className={styles.hero}>
          <h1 className={styles.title}>{decodeHtmlEntities(page.title.rendered)}</h1>
        </header>

        <section className={styles.content}>
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: decodeHtmlContent(page.content.rendered) }}
          />
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const pages = await fetchWordPressData('pages?slug=privacy-policy');
    const page = pages[0];

    if (!page) {
      return { notFound: true };
    }

    return {
      props: {
        page,
      }
    };
  } catch (error) {
    return { notFound: true };
  }
}
