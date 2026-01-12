import { useState } from 'react';
import styles from './AboutHistory.module.css';

interface HistoryItem {
  year: string;
  description: string;
}

interface AboutHistoryProps {
  historyItems?: HistoryItem[];
}

// Default history items (fallback)
const defaultHistoryItems: HistoryItem[] = [
  {
    year: '1897',
    description: 'Hotelier and author Orison Swett Marden sat in a small bedroom on Bowdoin Street in Boston churning out the very first issue of SUCCESS magazine.',
  },
  {
    year: '1930s',
    description: 'Think and Grow Rich by Napoleon Hill and How to Win Friends and Influence People by Dale Carnegie are published, which, along with SUCCESS, helped form the foundation of personal development.',
  },
  {
    year: '1954-1980',
    description: 'Napoleon Hill and W. Clement Stone, another writer and major personal development figure at the time, published the magazine as the rebranded SUCCESS Unlimited, eventually returning to its roots as SUCCESS.',
  },
  {
    year: '2008',
    description: 'After an acquisition by VideoPlus (later renamed SUCCESS Partners), the magazine was completely relaunched, bolstered for the first time by SUCCESS.com.',
  },
  {
    year: '2020',
    description: 'SUCCESS Enterprises was acquired by eXp World Holdings, the parent company of eXp Realty.',
  },
  {
    year: 'TODAY',
    description: 'SUCCESS Enterprises continues to be the authority in personal and professional development with SUCCESS magazine, in addition to the recently launched The SUCCESS Magazine Podcast and SUCCESS+, a digital-only magazine.',
  },
];

export default function AboutHistory({ historyItems = defaultHistoryItems }: AboutHistoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % historyItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + historyItems.length) % historyItems.length);
  };

  return (
    <section className={styles.historySection}>
      <div className={styles.carousel}>
        <button
          className={styles.prevButton}
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          ←
        </button>

        <div className={styles.slides}>
          {historyItems.map((item, index) => (
            <div
              key={item.year}
              className={`${styles.slide} ${
                index === currentSlide ? styles.active : ''
              }`}
            >
              <h3 className={styles.year}>{item.year}</h3>
              <p className={styles.description}>{item.description}</p>
            </div>
          ))}
        </div>

        <button
          className={styles.nextButton}
          onClick={nextSlide}
          aria-label="Next slide"
        >
          →
        </button>
      </div>

      <div className={styles.dots}>
        {historyItems.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
