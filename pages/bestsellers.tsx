import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { fetchWordPressData } from '../lib/wordpress';
import styles from './Bestsellers.module.css';

type BestsellerCategory = {
  id: string;
  title: string;
  books: Array<{
    id: string;
    title: string;
    author: string;
    image: string;
    link: string;
    price?: string;
  }>;
};

type BestsellersPageProps = {
  categories: BestsellerCategory[];
};

export default function BestsellersPage({ categories }: BestsellersPageProps) {
  return (
    <Layout>
      <SEO
        title="SUCCESS® Bestsellers - Top Books for Success"
        description="Explore curated lists of the best books in business, personal development, finance, leadership, and more."
        url="https://www.success.com/bestsellers"
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>SUCCESS® Bestsellers</h1>
          <p className={styles.subtitle}>
            Discover Your Next Favorite Read! Curated lists of the best books in business,
            personal development, finance, leadership, and more.
          </p>
        </header>

        {categories.map((category) => (
          <section key={category.id} className={styles.category}>
            <h2 className={styles.categoryTitle}>{category.title}</h2>
            <div className={styles.booksGrid}>
              {category.books.map((book) => (
                <div key={book.id} className={styles.bookCard}>
                  <a
                    href={book.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bookLink}
                  >
                    <div className={styles.bookCover}>
                      {book.image ? (
                        <img src={book.image} alt={book.title} loading="lazy" />
                      ) : (
                        <div className={styles.bookPlaceholder}>{book.title}</div>
                      )}
                    </div>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>by {book.author}</p>
                    {book.price && <p className={styles.bookPrice}>{book.price}</p>}
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className={styles.cta}>
          <h2>Find these books and more available now at</h2>
          <a href="/store" className={styles.ctaButton}>
            SUCCESS Store
          </a>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // In a real scenario, this data would come from WordPress or an API
  // For now, we'll use static data based on what we see on the homepage
  const categories: BestsellerCategory[] = [
    {
      id: 'top-picks',
      title: 'Top Picks',
      books: [
        {
          id: '1',
          title: 'Me, My Customer, and AI',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9781637634547.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '2',
          title: 'The Grit Factor',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9781633697263.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '3',
          title: 'Powerfully Likeable',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9780593797204.jpg',
          link: 'https://mysuccessplus.com',
        },
      ],
    },
    {
      id: 'business',
      title: 'Business Books',
      books: [
        {
          id: '4',
          title: 'The Double Tax',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9780593714256.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '5',
          title: 'Mission Driven',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9780306836510.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '6',
          title: 'Born to be Wired',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/10/9781668051535.jpg',
          link: 'https://mysuccessplus.com',
        },
      ],
    },
    {
      id: 'personal-development',
      title: 'Personal Development',
      books: [
        {
          id: '7',
          title: 'Both/And Thinking',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/09/9781647821043.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '8',
          title: 'Mistakes That Made Me a Millionaire',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/09/9781637747124.jpg',
          link: 'https://mysuccessplus.com',
        },
        {
          id: '9',
          title: 'Unbound',
          author: 'Various Authors',
          image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/09/9780593084526.jpg',
          link: 'https://mysuccessplus.com',
        },
      ],
    },
  ];

  return {
    props: {
      categories,
    },
  };
};
