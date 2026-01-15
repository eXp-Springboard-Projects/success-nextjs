import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import { supabaseAdmin } from '../../lib/supabase';
import styles from './store.module.css';

type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  description?: string | null;
  image: string;
  category: string;
  subcategory?: string | null;
  link: string;
  featured?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  badge?: string | null;
  productType?: string | null;
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
                  {product.badge ? (
                    <div className={styles.badge}>{product.badge}</div>
                  ) : product.salePrice && (
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
                    {product.description && (
                      <p className={styles.productDescription}>{product.description.substring(0, 100)}...</p>
                    )}
                    {product.rating && product.rating > 0 && (
                      <div className={styles.rating}>
                        <span className={styles.stars}>
                          {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
                        </span>
                        <span className={styles.ratingText}>
                          {product.rating.toFixed(1)} ({product.reviewCount})
                        </span>
                      </div>
                    )}
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
                    <a href={product.link} className={styles.buyButton}>
                      View Details
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
                {product.badge ? (
                  <div className={styles.badge}>{product.badge}</div>
                ) : product.salePrice && (
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
                  {product.description && (
                    <p className={styles.productDescription}>{product.description.substring(0, 80)}...</p>
                  )}
                  {product.rating && product.rating > 0 && (
                    <div className={styles.rating}>
                      <span className={styles.stars}>
                        {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
                      </span>
                      <span className={styles.ratingText}>
                        {product.rating.toFixed(1)} ({product.reviewCount})
                      </span>
                    </div>
                  )}
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
                  <a href={product.link} className={styles.buyButton}>
                    View Details
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
  try {
    const supabase = supabaseAdmin();

    // Fetch products from database
    const { data: dbProducts, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching store products from database:', error);
      // Fall back to empty array if there's an error
      return {
        props: {
          products: [],
          categories: ['Books', 'Courses', 'Merchandise', 'Magazines', 'Bundles'],
        },
      };
    }

    // Map database products to frontend format
    const products: Product[] = (dbProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
      description: p.description || null,
      image: p.image,
      category: p.category,
      subcategory: p.subcategory || null,
      link: p.link,
      featured: p.featured || false,
      rating: p.rating || null,
      reviewCount: p.review_count || null,
      badge: p.badge || null,
      productType: p.product_type || null,
    }));

    const categories = ['Books', 'Courses', 'Merchandise', 'Magazines', 'Bundles'];

    return {
      props: {
        products,
        categories,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    // Fallback to empty array - all products should be managed in Supabase via /admin/store-products
    const products: Product[] = [];

    const categories = ['Books', 'Courses', 'Merchandise', 'Magazines', 'Bundles'];

    return {
      props: {
        products,
        categories,
      },
    };
  }
};
