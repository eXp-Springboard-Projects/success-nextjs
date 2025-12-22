import Link from 'next/link';
import styles from './Trending.module.css';
import { decodeHtmlEntities } from '../lib/htmlDecode';
import UpsellAd from './UpsellAd';

export default function Trending({ posts }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.header}>TRENDING</h3>
      <ol className={styles.list}>
        {posts.map((post, index) => {
          const category = decodeHtmlEntities(post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Uncategorized');
          const title = decodeHtmlEntities(post.title.rendered);

          return (
            <li key={post.id}>
              <Link href={`/${post.slug}`} className={styles.link}>
                <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
                <div className={styles.content}>
                  <span className={styles.category}>{category}</span>
                  <span className={styles.title}>{title}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Sidebar Upsell Ad */}
      <UpsellAd variant="sidebar" />
    </div>
  );
}
