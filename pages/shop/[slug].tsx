import { GetStaticPaths, GetStaticProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import { supabaseAdmin } from '../../lib/supabase';
import { useCart } from '../../lib/CartContext';
import styles from './product.module.css';

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  subcategory?: string;
  thumbnail: string;
  images: string[];
  externalUrl?: string;
  isFeatured: boolean;
  stock: number;
};

type ProductPageProps = {
  product: Product;
};

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.thumbnail);
  const [adding, setAdding] = useState(false);

  const currentPrice = product.salePrice || product.price;
  const savings = product.salePrice ? product.price - product.salePrice : 0;

  const handleAddToCart = () => {
    if (product.externalUrl) {
      window.open(product.externalUrl, '_blank');
    } else {
      setAdding(true);
      addItem(product, quantity);
      setTimeout(() => {
        setAdding(false);
        router.push('/shop/cart');
      }, 300);
    }
  };

  return (
    <Layout>
      <SEO
        title={`${product.title} - SUCCESS Store`}
        description={product.description || `Purchase ${product.title} from the SUCCESS Store`}
        url={`https://www.success.com/shop/${product.slug}`}
        image={product.thumbnail}
      />

      <div className={styles.productPage}>
        <div className={styles.container}>
          <div className={styles.productGrid}>
            {/* Product Images */}
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                <img src={selectedImage} alt={product.title} />
              </div>
              {product.images && product.images.length > 1 && (
                <div className={styles.thumbnails}>
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      className={selectedImage === img ? styles.thumbnailActive : styles.thumbnail}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={`${product.title} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className={styles.infoSection}>
              <div className={styles.breadcrumbs}>
                <a href="/store">Store</a> / <span>{product.category}</span>
                {product.subcategory && <> / <span>{product.subcategory}</span></>}
              </div>

              <h1 className={styles.title}>{product.title}</h1>

              <div className={styles.pricing}>
                {product.salePrice ? (
                  <>
                    <span className={styles.salePrice}>${currentPrice.toFixed(2)}</span>
                    <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                    <span className={styles.savings}>Save ${savings.toFixed(2)}</span>
                  </>
                ) : (
                  <span className={styles.price}>${product.price.toFixed(2)}</span>
                )}
              </div>

              {product.description && (
                <div className={styles.description}>
                  <p>{product.description}</p>
                </div>
              )}

              <div className={styles.stock}>
                {product.stock > 0 ? (
                  <span className={styles.inStock}>✓ In Stock</span>
                ) : (
                  <span className={styles.outOfStock}>Out of Stock</span>
                )}
              </div>

              <div className={styles.actions}>
                <div className={styles.quantitySelector}>
                  <label>Quantity:</label>
                  <div className={styles.quantityButtons}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className={styles.addToCartButton}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || adding}
                >
                  {adding ? 'Adding...' : product.externalUrl ? 'Buy Now' : 'Add to Cart'}
                </button>
              </div>

              <div className={styles.meta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Category:</span>
                  <span className={styles.metaValue}>{product.category}</span>
                </div>
                {product.subcategory && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Subcategory:</span>
                    <span className={styles.metaValue}>{product.subcategory}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const supabase = supabaseAdmin();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('isPublished', true);

  const paths = (products || []).map((product) => ({
    params: { slug: product.slug },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return { notFound: true };
  }

  const supabase = supabaseAdmin();
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('isPublished', true)
    .single();

  if (error || !product) {
    return { notFound: true };
  }

  return {
    props: { product },
    revalidate: 600, // Revalidate every 10 minutes
  };
};
