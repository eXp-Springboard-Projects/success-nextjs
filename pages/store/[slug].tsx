import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import Image from 'next/image';
import { supabaseAdmin } from '../../lib/supabase';
import styles from './productDetail.module.css';

type Review = {
  id: string;
  user_name: string;
  rating: number;
  title?: string;
  review: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  description?: string;
  longDescription?: string;
  features?: string[];
  author?: string;
  format?: string;
  duration?: string;
  skillLevel?: string;
  includes?: string[];
  rating?: number;
  reviewCount?: number;
  image: string;
  galleryImages?: string[];
  category: string;
  subcategory?: string;
  link: string;
  productType?: string;
  digital?: boolean;
  instructor?: string;
  certification?: boolean;
  badge?: string;
  videoUrl?: string;
};

type ProductPageProps = {
  product: Product;
  reviews: Review[];
  relatedProducts: Product[];
};

export default function ProductPage({ product, reviews, relatedProducts }: ProductPageProps) {
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const savings = product.salePrice ? product.price - product.salePrice : 0;
  const savingsPercent = product.salePrice ? Math.round((savings / product.price) * 100) : 0;

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  const handleBuyNow = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-product-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1 }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={`${product.name} | SUCCESS Store`}
        description={product.description || `Shop ${product.name} at the SUCCESS Store`}
        image={product.image}
        url={`https://www.success.com/store/${product.id}`}
      />

      <div className={styles.productPage}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumbs}>
          <a href="/store">Store</a>
          <span>/</span>
          <a href={`/store?category=${product.category}`}>{product.category}</a>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className={styles.productSection}>
          {/* Image Gallery */}
          <div className={styles.imageSection}>
            {product.badge && (
              <div className={styles.badge}>{product.badge}</div>
            )}
            <div className={styles.mainImage}>
              <Image
                src={selectedImage}
                alt={product.name}
                width={600}
                height={600}
                style={{ objectFit: 'contain' }}
              />
            </div>
            {product.galleryImages && product.galleryImages.length > 0 && (
              <div className={styles.thumbnails}>
                <button onClick={() => setSelectedImage(product.image)}>
                  <Image src={product.image} alt="" width={80} height={80} />
                </button>
                {product.galleryImages.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(img)}>
                    <Image src={img} alt="" width={80} height={80} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.infoSection}>
            <h1>{product.name}</h1>

            {product.author && (
              <p className={styles.author}>by {product.author}</p>
            )}

            {product.instructor && (
              <p className={styles.instructor}>Instructor: {product.instructor}</p>
            )}

            {/* Rating */}
            {product.rating && product.rating > 0 && (
              <div className={styles.ratingSection}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(product.rating!) ? styles.starFilled : styles.starEmpty}>
                      ★
                    </span>
                  ))}
                </div>
                <span className={styles.ratingText}>
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className={styles.priceSection}>
              {product.salePrice ? (
                <>
                  <span className={styles.salePrice}>${product.salePrice.toFixed(2)}</span>
                  <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                  <span className={styles.savings}>Save ${savings.toFixed(2)} ({savingsPercent}%)</span>
                </>
              ) : (
                <span className={styles.price}>${product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <div className={styles.description}>
              <p>{product.description}</p>
            </div>

            {/* Course Details */}
            {product.productType === 'course' && (
              <div className={styles.courseDetails}>
                {product.duration && (
                  <div className={styles.detail}>
                    <strong>Duration:</strong> {product.duration}
                  </div>
                )}
                {product.skillLevel && (
                  <div className={styles.detail}>
                    <strong>Level:</strong> {product.skillLevel}
                  </div>
                )}
                {product.certification && (
                  <div className={styles.detail}>
                    <strong>✓ Certificate of Completion</strong>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <div className={styles.ctaSection}>
              <button
                onClick={handleBuyNow}
                className={styles.buyButton}
                disabled={loading}
              >
                {loading ? 'Processing...' : product.productType === 'course' ? 'Enroll Now' : 'Buy Now'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
              {product.digital && (
                <p className={styles.digitalNote}>✓ Instant digital access</p>
              )}
            </div>

            {/* What's Included */}
            {product.includes && product.includes.length > 0 && (
              <div className={styles.includesSection}>
                <h3>What's Included:</h3>
                <ul>
                  {product.includes.map((item, idx) => (
                    <li key={idx}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <section className={styles.featuresSection}>
            <h2>Features</h2>
            <div className={styles.featuresGrid}>
              {product.features.map((feature, idx) => (
                <div key={idx} className={styles.featureCard}>
                  <span className={styles.checkmark}>✓</span>
                  <p>{feature}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Long Description */}
        {product.longDescription && (
          <section className={styles.detailsSection}>
            <h2>About This {product.productType === 'course' ? 'Course' : 'Product'}</h2>
            <div className={styles.longDescription}>
              <p>{product.longDescription}</p>
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className={styles.reviewsSection}>
            <h2>Customer Reviews</h2>
            <div className={styles.reviewsSummary}>
              <div className={styles.averageRating}>
                <div className={styles.bigRating}>{product.rating?.toFixed(1)}</div>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(product.rating!) ? styles.starFilled : styles.starEmpty}>
                      ★
                    </span>
                  ))}
                </div>
                <div className={styles.totalReviews}>{product.reviewCount} reviews</div>
              </div>
            </div>

            <div className={styles.reviewsList}>
              {displayedReviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <div className={styles.reviewerName}>
                        {review.user_name}
                        {review.verified_purchase && (
                          <span className={styles.verifiedBadge}>✓ Verified Purchase</span>
                        )}
                      </div>
                      <div className={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
                  <p className={styles.reviewText}>{review.review}</p>
                  <div className={styles.reviewFooter}>
                    <button className={styles.helpfulButton}>
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > 5 && !showAllReviews && (
              <button
                className={styles.showMoreButton}
                onClick={() => setShowAllReviews(true)}
              >
                Show All {reviews.length} Reviews
              </button>
            )}
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((related) => (
                <a key={related.id} href={`/store/${related.id}`} className={styles.relatedCard}>
                  <Image src={related.image} alt={related.name} width={200} height={200} />
                  <h4>{related.name}</h4>
                  <div className={styles.relatedPrice}>
                    {related.salePrice ? (
                      <>
                        <span className={styles.salePrice}>${related.salePrice.toFixed(2)}</span>
                        <span className={styles.originalPrice}>${related.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span>${related.price.toFixed(2)}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;

  try {
    const supabase = supabaseAdmin();

    // Fetch product
    const { data: product, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return { notFound: true };
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', slug)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch related products
    const { data: relatedProducts } = await supabase
      .from('store_products')
      .select('*')
      .eq('category', product.category)
      .eq('is_active', true)
      .neq('id', slug)
      .limit(4);

    // Map product to frontend format
    const mappedProduct: Product = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
      description: product.description,
      longDescription: product.long_description,
      features: product.features,
      author: product.author,
      format: product.format,
      duration: product.duration,
      skillLevel: product.skill_level,
      includes: product.includes,
      rating: product.rating,
      reviewCount: product.review_count,
      image: product.image,
      galleryImages: product.gallery_images,
      category: product.category,
      subcategory: product.subcategory,
      link: product.link,
      productType: product.product_type,
      digital: product.digital,
      instructor: product.instructor,
      certification: product.certification,
      badge: product.badge,
      videoUrl: product.video_url,
    };

    return {
      props: {
        product: mappedProduct,
        reviews: reviews || [],
        relatedProducts: (relatedProducts || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
          image: p.image,
          category: p.category,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { notFound: true };
  }
};
