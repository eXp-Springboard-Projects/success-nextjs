import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import styles from './store.module.css';

type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  link: string;
  featured?: boolean;
};

type StorePageProps = {
  products: Product[];
  categories: string[];
};

export default function StorePage({ products, categories }: StorePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  const filteredProducts = products.filter(p =>
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return (a.salePrice || a.price) - (b.salePrice || b.price);
    if (sortBy === 'price-high') return (b.salePrice || b.price) - (a.salePrice || a.price);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    // Default: featured first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  const featuredProducts = products.filter(p => p.featured);

  return (
    <Layout>
      <SEO
        title="SUCCESS Store - Books, Courses & Merchandise"
        description="Shop books, courses, merchandise and digital content from SUCCESS Magazine. Jim Rohn books, leadership courses, and exclusive SUCCESS gear."
        url="https://www.success.com/store"
      />

      <div className={styles.storePage}>
        {/* Hero Section */}
        <header className={styles.hero}>
          <h1>SUCCESS Store</h1>
          <p>Curated resources to accelerate your personal and professional growth</p>
        </header>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className={styles.featuredSection}>
            <h2>Featured Products</h2>
            <div className={styles.featuredGrid}>
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product.id} className={styles.featuredCard}>
                  {product.salePrice && (
                    <div className={styles.saleBadge}>Sale</div>
                  )}
                  <div className={styles.productImage}>
                    <img
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={400}
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.startsWith('data:')) {
                          // Fallback to placeholder if real image fails to load
                          const categoryColors: Record<string, string> = {
                            'Books': '#2c5282',
                            'Courses': '#2c7a7b',
                            'Merchandise': '#744210',
                            'Magazines': '#c53030',
                            'Bundles': '#5f370e',
                          };
                          const bgColor = categoryColors[product.category] || '#1a1a1a';
                          const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" dy=".3em">${product.name.substring(0, 30)}</text></svg>`;
                          target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                        }
                      }}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <div className={styles.priceRow}>
                      {product.salePrice ? (
                        <>
                          <span className={styles.salePrice}>${product.salePrice.toFixed(2)}</span>
                          <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className={styles.price}>${product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <a href={product.link} className={styles.buyButton} target="_blank" rel="noopener noreferrer">
                      View Product
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className={styles.filtersSection}>
          <div className={styles.filterBar}>
            <div className={styles.categoryFilters}>
              <button
                className={selectedCategory === 'All' ? styles.active : ''}
                onClick={() => setSelectedCategory('All')}
              >
                All Products ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    className={selectedCategory === cat ? styles.active : ''}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className={styles.sortFilter}>
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className={styles.productsSection}>
          <div className={styles.productsGrid}>
            {sortedProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                {product.salePrice && (
                  <div className={styles.saleBadge}>Sale</div>
                )}
                <div className={styles.productImage}>
                  <img
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={400}
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.startsWith('data:')) {
                        // Fallback to placeholder if real image fails to load
                        const categoryColors: Record<string, string> = {
                          'Books': '#2c5282',
                          'Courses': '#2c7a7b',
                          'Merchandise': '#744210',
                          'Magazines': '#c53030',
                          'Bundles': '#5f370e',
                        };
                        const bgColor = categoryColors[product.category] || '#1a1a1a';
                        const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" dy=".3em">${product.name.substring(0, 30)}</text></svg>`;
                        target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                      }
                    }}
                  />
                </div>
                <div className={styles.productInfo}>
                  <p className={styles.productCategory}>{product.subcategory || product.category}</p>
                  <h3>{product.name}</h3>
                  <div className={styles.priceRow}>
                    {product.salePrice ? (
                      <>
                        <span className={styles.salePrice}>${product.salePrice.toFixed(2)}</span>
                        <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                        <span className={styles.savings}>
                          Save ${(product.price - product.salePrice).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className={styles.price}>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  <a href={product.link} className={styles.buyButton} target="_blank" rel="noopener noreferrer">
                    View Product
                  </a>
                </div>
              </div>
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className={styles.noProducts}>
              <p>No products found in this category.</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2>Want Unlimited Access?</h2>
          <p>Join SUCCESS+ for unlimited courses, exclusive content, and member discounts</p>
          <a href="/offer/success-plus" className={styles.ctaButton}>
            Explore SUCCESS+ Membership
          </a>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // Helper function to generate placeholder image data URIs for products without images (inline SVG)
  const getPlaceholderImage = (name: string, category: string) => {
    const colors: Record<string, string> = {
      'Books': '#2c5282',
      'Courses': '#2c7a7b',
      'Merchandise': '#744210',
      'Magazines': '#c53030',
      'Bundles': '#5f370e',
    };
    const bgColor = colors[category] || '#1a1a1a';
    const textColor = '#ffffff';

    // Create an inline SVG as a data URI - using encodeURIComponent for browser compatibility
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="${textColor}" text-anchor="middle" dy=".3em">${name}</text></svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Comprehensive product catalog organized by category - using direct image URLs from SUCCESS Store
  const products: Product[] = [
    // FEATURED BUNDLES
    {
      id: 'bundle-1',
      name: 'Jim Rohn Book Bundle',
      price: 181.69,
      salePrice: 97.00,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/e/848/jr_book-bundle__68973.jpg',
      category: 'Bundles',
      link: 'https://mysuccessplus.com/shop',
      featured: true
    },

    // BOOKS - Jim Rohn Collection
    {
      id: 'book-1',
      name: 'The Five Major Pieces to the Life Puzzle',
      price: 24.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/i/808/jr010-002__12948.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/five-major-pieces-life-puzzle'
    },
    {
      id: 'book-2',
      name: 'The Seasons of Life',
      price: 19.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/n/765/jr010-008_1_1__09293.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/seasons-of-life'
    },
    {
      id: 'book-3',
      name: 'Twelve Pillars',
      price: 22.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/f/057/jr010-010_1__00354.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/twelve-pillars'
    },
    {
      id: 'book-4',
      name: 'Leading an Inspired Life',
      price: 29.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/w/124/jr010-004__26100.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/leading-an-inspired-life',
      featured: true
    },
    {
      id: 'book-5',
      name: '7 Strategies for Wealth & Happiness',
      price: 26.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/jr010-007__74951-1.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/7-strategies-wealth-happiness'
    },
    {
      id: 'book-6',
      name: 'The Art of Exceptional Living',
      price: 24.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/The_Art_of_Exceptinal_Living_MP3_product_image__39905-1.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/art-of-exceptional-living'
    },
    {
      id: 'book-7',
      name: 'The Treasury of Quotes',
      price: 19.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/z/244/jr-thetreasuryofquotes-lg__76474.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/treasury-of-quotes'
    },
    {
      id: 'book-8',
      name: 'My Philosophy for Successful Living',
      price: 22.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/h/235/jr010-006__17735.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/my-philosophy-successful-living'
    },
    {
      id: 'book-9',
      name: 'The Challenge to Succeed',
      price: 21.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/sm24-04-july-aug-featured-1.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/challenge-to-succeed'
    },
    {
      id: 'book-10',
      name: 'Building Your Network Marketing Business',
      price: 23.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/x/826/jr010-009_1__98084.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/network-marketing-business'
    },

    // COURSES
    {
      id: 'course-1',
      name: "Jim Rohn's Foundations for Success",
      price: 199.99,
      image: '/images/products/jim-rohn-foundations.jpg',
      category: 'Courses',
      subcategory: 'Personal Development',
      link: '/shop/jim-rohns-foundations-for-success',
      featured: true
    },
    {
      id: 'course-2',
      name: 'Leadership Masterclass',
      price: 149.99,
      image: '/images/products/leadership-masterclass.jpg',
      category: 'Courses',
      subcategory: 'Leadership',
      link: '/shop/leadership-masterclass'
    },
    {
      id: 'course-3',
      name: 'Personal Development Blueprint',
      price: 179.99,
      image: '/images/products/personal-development.jpg',
      category: 'Courses',
      subcategory: 'Personal Development',
      link: '/shop/personal-development-blueprint'
    },
    {
      id: 'course-4',
      name: 'Time Management Mastery',
      price: 99.99,
      image: '/images/products/time-management.jpg',
      category: 'Courses',
      subcategory: 'Productivity',
      link: '/shop/time-management-mastery'
    },
    {
      id: 'course-5',
      name: 'Goal Setting for Success',
      price: 79.99,
      image: '/images/products/goal-setting.jpg',
      category: 'Courses',
      subcategory: 'Personal Development',
      link: '/shop/goal-setting-for-success'
    },
    {
      id: 'course-6',
      name: 'Communication Skills Bootcamp',
      price: 129.99,
      image: '/images/products/communication-skills.jpg',
      category: 'Courses',
      subcategory: 'Leadership',
      link: '/shop/communication-skills-bootcamp'
    },

    // MERCHANDISE
    {
      id: 'merch-1',
      name: 'The SUCCESS Starts Here Journal',
      price: 14.99,
      salePrice: 9.71,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/S23_Journal_SUCCESS-STARTS-HERE__48992-1.png',
      category: 'Merchandise',
      subcategory: 'Journals & Planners',
      link: '/shop/success-starts-here-journal',
      featured: true
    },
    {
      id: 'merch-planner-1',
      name: 'Jim Rohn One-Year Success Planner',
      price: 29.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/z/364/JRohn_One_Year_Success_Planner_strapped__74510.png',
      category: 'Merchandise',
      subcategory: 'Journals & Planners',
      link: '/shop/jim-rohn-success-planner'
    },
    {
      id: 'book-guides-1',
      name: 'The Jim Rohn Guides Complete Set',
      price: 18.71,
      image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/s/745/jr_complete-guide-set-3d__33414.jpg',
      category: 'Books',
      subcategory: 'Jim Rohn',
      link: '/shop/jim-rohn-guides-complete-set'
    },
    {
      id: 'merch-2',
      name: 'SUCCESS EST. 1897 Stone Cap',
      price: 24.99,
      image: '/images/products/stone-cap.jpg',
      category: 'Merchandise',
      subcategory: 'Apparel',
      link: '/shop/success-stone-cap'
    },
    {
      id: 'merch-3',
      name: 'SUCCESS Classic Covers 15-oz Ceramic Mug',
      price: 16.99,
      image: '/images/products/ceramic-mug.jpg',
      category: 'Merchandise',
      subcategory: 'Drinkware',
      link: '/shop/success-ceramic-mug'
    },
    {
      id: 'merch-4',
      name: 'SUCCESS Logo T-Shirt (Black)',
      price: 19.99,
      image: '/images/products/tshirt-black.jpg',
      category: 'Merchandise',
      subcategory: 'Apparel',
      link: '/shop/success-tshirt-black'
    },
    {
      id: 'merch-5',
      name: 'SUCCESS Logo T-Shirt (White)',
      price: 19.99,
      image: '/images/products/tshirt-white.jpg',
      category: 'Merchandise',
      subcategory: 'Apparel',
      link: '/shop/success-tshirt-white'
    },
    {
      id: 'merch-6',
      name: 'SUCCESS Hoodie (Navy)',
      price: 39.99,
      image: '/images/products/hoodie-navy.jpg',
      category: 'Merchandise',
      subcategory: 'Apparel',
      link: '/shop/success-hoodie-navy'
    },
    {
      id: 'merch-7',
      name: 'SUCCESS Notepad Set',
      price: 14.99,
      image: '/images/products/notepad-set.jpg',
      category: 'Merchandise',
      subcategory: 'Office Supplies',
      link: '/shop/success-notepad-set'
    },
    {
      id: 'merch-8',
      name: 'SUCCESS Water Bottle',
      price: 17.99,
      image: '/images/products/water-bottle.jpg',
      category: 'Merchandise',
      subcategory: 'Drinkware',
      link: '/shop/success-water-bottle'
    },
    {
      id: 'merch-9',
      name: 'SUCCESS Tote Bag',
      price: 16.99,
      image: '/images/products/tote-bag.jpg',
      category: 'Merchandise',
      subcategory: 'Bags & Accessories',
      link: '/shop/success-tote-bag'
    },
    {
      id: 'merch-10',
      name: 'SUCCESS Pen Set (3-pack)',
      price: 12.99,
      image: '/images/products/pen-set.jpg',
      category: 'Merchandise',
      subcategory: 'Office Supplies',
      link: '/shop/success-pen-set'
    },

    // MAGAZINES
    {
      id: 'mag-1',
      name: 'SUCCESS Magazine - November/December 2024',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/10/SUCCESS-NovDec-2024-Eva-Longoria-Digital-Cover.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-nov-dec-2024'
    },
    {
      id: 'mag-2',
      name: 'SUCCESS Magazine - March/April 2023 (Lewis Howes)',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/SM23_02_MARAPR_LEWIS_HOWES_NO_BARCODE_WEB_r1__33203-1.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-mar-apr-2023',
      featured: true
    },
    {
      id: 'mag-3',
      name: 'SUCCESS Magazine - September/October 2024',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/09/SUCCESS-SeptOct-2024-Shark-Tank-Digital-Cover.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-sept-oct-2024'
    },
    {
      id: 'mag-4',
      name: 'SUCCESS Magazine - July/August 2024',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/sm24-04-july-aug-featured-1.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-july-aug-2024'
    },
    {
      id: 'mag-5',
      name: 'SUCCESS Magazine - May/June 2024',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/05/SUCCESS-MayJun-2024-Bethany-Hamilton-Digital-Cover.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-may-jun-2024'
    },
    {
      id: 'mag-6',
      name: 'SUCCESS Magazine - March/April 2024',
      price: 9.99,
      image: 'https://mysuccessplus.com/wp-content/uploads/2024/03/SUCCESS-MarApr-2024-Emily-Calandrelli-Digital-Cover.jpg',
      category: 'Magazines',
      link: '/shop/success-magazine-mar-apr-2024'
    },
  ];

  const categories = ['Books', 'Courses', 'Merchandise', 'Magazines', 'Bundles'];

  return {
    props: {
      products,
      categories,
    },
  };
};
