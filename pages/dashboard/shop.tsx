import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import shopStyles from './shop.module.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  memberDiscount?: number;
}

export default function ShopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/signin?redirect=/dashboard/shop');
    return null;
  }

  const products: Product[] = [
    {
      id: '1',
      name: 'SUCCESS Magazine Annual Subscription',
      description: '12 issues of SUCCESS Magazine delivered to your door',
      price: 29.97,
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/11/SD25_06_NOV_DIGITAL-ED-_-COVER-_-RORY-VADEN_2048x1082-1.jpg',
      category: 'Magazine',
      memberDiscount: 20,
    },
    {
      id: '2',
      name: 'Personal Development Planner 2025',
      description: 'Set and achieve your goals with this comprehensive planner',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&fit=crop',
      category: 'Books & Planners',
      memberDiscount: 15,
    },
    {
      id: '3',
      name: 'SUCCESS Elite Conference Ticket',
      description: 'Join top entrepreneurs at our annual conference',
      price: 497.00,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop',
      category: 'Events',
      memberDiscount: 25,
    },
    {
      id: '4',
      name: 'The Success Principles Book Bundle',
      description: '5 essential books for personal and professional growth',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
      category: 'Books & Planners',
      memberDiscount: 20,
    },
    {
      id: '5',
      name: 'Virtual Mastermind Session',
      description: 'Monthly group coaching with industry experts',
      price: 197.00,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop',
      category: 'Coaching',
      memberDiscount: 30,
    },
    {
      id: '6',
      name: 'SUCCESS Podcast Exclusive Merch',
      description: 'Official SUCCESS branded merchandise',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
      category: 'Merchandise',
      memberDiscount: 10,
    },
  ];

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const calculateDiscount = (price: number, discount?: number) => {
    if (!discount) return null;
    const discountedPrice = price - (price * discount / 100);
    return {
      original: price,
      discounted: discountedPrice,
      savings: price - discountedPrice,
    };
  };

  return (
    <>
      <Head>
        <title>Shop - SUCCESS+</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <Link href="/dashboard/community">
              <button><span className={styles.icon}>👥</span> Community</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button className={styles.active}><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>SUCCESS Shop</h1>
            <p className={styles.subtitle}>Exclusive products and member discounts</p>
          </div>

          <div className={shopStyles.memberBanner}>
            <div className={shopStyles.bannerContent}>
              <span className={shopStyles.bannerIcon}>⭐</span>
              <div>
                <h3>SUCCESS+ Member Benefits</h3>
                <p>Enjoy exclusive discounts up to 30% off on all products!</p>
              </div>
            </div>
          </div>

          <div className={shopStyles.categoryFilter}>
            {categories.map(category => (
              <button
                key={category}
                className={selectedCategory === category ? shopStyles.activeCategory : ''}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>

          <div className={shopStyles.productsGrid}>
            {filteredProducts.map(product => {
              const discount = calculateDiscount(product.price, product.memberDiscount);
              return (
                <div key={product.id} className={shopStyles.productCard}>
                  {product.memberDiscount && (
                    <div className={shopStyles.discountBadge}>
                      {product.memberDiscount}% OFF
                    </div>
                  )}
                  <div className={shopStyles.productImage}>
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="16"%3EProduct Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <div className={shopStyles.productContent}>
                    <div className={shopStyles.productCategory}>{product.category}</div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className={shopStyles.productFooter}>
                      {discount ? (
                        <div className={shopStyles.priceSection}>
                          <span className={shopStyles.originalPrice}>${discount.original.toFixed(2)}</span>
                          <span className={shopStyles.discountedPrice}>${discount.discounted.toFixed(2)}</span>
                          <span className={shopStyles.savings}>Save ${discount.savings.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className={shopStyles.priceSection}>
                          <span className={shopStyles.price}>${product.price.toFixed(2)}</span>
                        </div>
                      )}
                      <button
                        className={shopStyles.buyBtn}
                        onClick={() => window.open(`https://mysuccessplus.com/shop/product/${product.id}`, '_blank')}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={shopStyles.shopInfo}>
            <h2>Why Shop with SUCCESS?</h2>
            <div className={shopStyles.infoGrid}>
              <div className={shopStyles.infoCard}>
                <span className={shopStyles.infoIcon}>⭐</span>
                <h3>Member Discounts</h3>
                <p>Exclusive savings for SUCCESS+ members</p>
              </div>
              <div className={shopStyles.infoCard}>
                <span className={shopStyles.infoIcon}>🚚</span>
                <h3>Fast Shipping</h3>
                <p>Free shipping on orders over $50</p>
              </div>
              <div className={shopStyles.infoCard}>
                <span className={shopStyles.infoIcon}>↩️</span>
                <h3>Easy Returns</h3>
                <p>30-day money-back guarantee</p>
              </div>
              <div className={shopStyles.infoCard}>
                <span className={shopStyles.infoIcon}>🔒</span>
                <h3>Secure Checkout</h3>
                <p>Your information is safe with us</p>
              </div>
            </div>
          </div>

          <div className={shopStyles.browseMore}>
            <h3>Want More Options?</h3>
            <p>Visit our full online store for hundreds of products to support your success journey</p>
            <button
              className={shopStyles.fullStoreBtn}
              onClick={() => window.open('https://store.success.com', '_blank')}
            >
              Visit Full Store
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
