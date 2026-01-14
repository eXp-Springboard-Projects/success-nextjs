import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './posts/AdminPosts.module.css';

interface StoreProduct {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  description?: string;
  long_description?: string;
  features?: string[];
  includes?: string[];
  author?: string;
  isbn?: string;
  format?: string;
  duration?: string;
  skill_level?: string;
  instructor?: string;
  certification?: boolean;
  image: string;
  gallery_images?: string[];
  video_url?: string;
  category: string;
  subcategory?: string;
  link: string;
  featured: boolean;
  badge?: string;
  product_type?: string;
  digital?: boolean;
  rating?: number;
  review_count?: number;
  inventory_count?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function StoreProductsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    description: '',
    longDescription: '',
    features: '',
    includes: '',
    author: '',
    isbn: '',
    format: '',
    duration: '',
    skillLevel: '',
    instructor: '',
    certification: false,
    image: '',
    galleryImages: '',
    videoUrl: '',
    category: 'Books',
    subcategory: '',
    link: '',
    featured: false,
    badge: '',
    productType: 'physical',
    digital: false,
    inventoryCount: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/store-products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert form data to database format
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        sale_price: formData.salePrice ? parseFloat(formData.salePrice) : null,
        description: formData.description || null,
        long_description: formData.longDescription || null,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
        includes: formData.includes ? formData.includes.split('\n').filter(i => i.trim()) : null,
        author: formData.author || null,
        isbn: formData.isbn || null,
        format: formData.format || null,
        duration: formData.duration || null,
        skill_level: formData.skillLevel || null,
        instructor: formData.instructor || null,
        certification: formData.certification,
        image: formData.image,
        gallery_images: formData.galleryImages ? formData.galleryImages.split('\n').filter(g => g.trim()) : null,
        video_url: formData.videoUrl || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        link: formData.link,
        featured: formData.featured,
        badge: formData.badge || null,
        product_type: formData.productType,
        digital: formData.digital,
        inventory_count: formData.inventoryCount ? parseInt(formData.inventoryCount) : null,
        display_order: formData.displayOrder,
        is_active: formData.isActive,
      };

      const url = '/api/admin/store-products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = editingProduct ? { ...payload, id: editingProduct.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchProducts();
        resetForm();
        alert(editingProduct ? 'Product updated!' : 'Product added!');
      } else {
        alert('Failed to save product');
      }
    } catch (error) {
      alert('Failed to save product');
    }
  };

  const handleEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      salePrice: product.sale_price?.toString() || '',
      description: product.description || '',
      longDescription: product.long_description || '',
      features: product.features?.join('\n') || '',
      includes: product.includes?.join('\n') || '',
      author: product.author || '',
      isbn: product.isbn || '',
      format: product.format || '',
      duration: product.duration || '',
      skillLevel: product.skill_level || '',
      instructor: product.instructor || '',
      certification: product.certification || false,
      image: product.image,
      galleryImages: product.gallery_images?.join('\n') || '',
      videoUrl: product.video_url || '',
      category: product.category,
      subcategory: product.subcategory || '',
      link: product.link,
      featured: product.featured,
      badge: product.badge || '',
      productType: product.product_type || 'physical',
      digital: product.digital || false,
      inventoryCount: product.inventory_count?.toString() || '',
      displayOrder: product.display_order,
      isActive: product.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch('/api/admin/store-products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchProducts();
        alert('Product deleted!');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      salePrice: '',
      description: '',
      longDescription: '',
      features: '',
      includes: '',
      author: '',
      isbn: '',
      format: '',
      duration: '',
      skillLevel: '',
      instructor: '',
      certification: false,
      image: '',
      galleryImages: '',
      videoUrl: '',
      category: 'Books',
      subcategory: '',
      link: '',
      featured: false,
      badge: '',
      productType: 'physical',
      digital: false,
      inventoryCount: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const moveUp = async (product: StoreProduct) => {
    const currentIndex = products.findIndex(p => p.id === product.id);
    if (currentIndex === 0) return;

    const prevProduct = products[currentIndex - 1];
    await updateDisplayOrder(product.id, prevProduct.display_order);
    await updateDisplayOrder(prevProduct.id, product.display_order);
    await fetchProducts();
  };

  const moveDown = async (product: StoreProduct) => {
    const currentIndex = products.findIndex(p => p.id === product.id);
    if (currentIndex === products.length - 1) return;

    const nextProduct = products[currentIndex + 1];
    await updateDisplayOrder(product.id, nextProduct.display_order);
    await updateDisplayOrder(nextProduct.id, product.display_order);
    await fetchProducts();
  };

  const updateDisplayOrder = async (id: string, displayOrder: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    await fetch('/api/admin/store-products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: product.name,
        price: product.price,
        salePrice: product.sale_price,
        image: product.image,
        category: product.category,
        subcategory: product.subcategory,
        link: product.link,
        featured: product.featured,
        displayOrder,
        isActive: product.is_active,
      }),
    });
  };

  const categories = ['Books', 'Courses', 'Merchandise', 'Magazines', 'Bundles'];
  const productTypes = ['physical', 'course', 'digital', 'book', 'membership'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading store products...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.postsPage}>
        <div className={styles.header}>
          <div>
            <h1>Store Products</h1>
            <p className={styles.subtitle}>Manage all store products with Stripe checkout integration</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.newButton}
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Sale Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., Jim Rohn, Leadership"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Product Type *
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g., Bestseller, New, Featured"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Inventory Count
                  </label>
                  <input
                    type="number"
                    value={formData.inventoryCount}
                    onChange={(e) => setFormData({ ...formData, inventoryCount: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                Description & Details
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Short Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief product description shown in cards"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Long Description
                </label>
                <textarea
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  rows={4}
                  placeholder="Detailed product description shown on product page"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Features (one per line)
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={5}
                    placeholder="8 weeks of content&#10;Live Q&A sessions&#10;Certificate included"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Includes (one per line)
                  </label>
                  <textarea
                    value={formData.includes}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                    rows={5}
                    placeholder="Video lessons&#10;Workbooks&#10;Lifetime access"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Product-Specific Fields */}
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                Product-Specific Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* For Books */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Author (for books)
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Jim Rohn"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    ISBN (for books)
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-0-123456-78-9"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Format (for books)
                  </label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    placeholder="Hardcover, Paperback, Ebook"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* For Courses */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Instructor (for courses)
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="SUCCESS Magazine Experts"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Duration (for courses)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="8 weeks, Self-paced"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Skill Level (for courses)
                  </label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select skill level</option>
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Media */}
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                Media & Images
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Main Product Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  required
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    style={{
                      marginTop: '0.5rem',
                      maxWidth: '150px',
                      borderRadius: '8px'
                    }}
                  />
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Gallery Images (one URL per line)
                </label>
                <textarea
                  value={formData.galleryImages}
                  onChange={(e) => setFormData({ ...formData, galleryImages: e.target.value })}
                  rows={3}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Video URL (YouTube, Vimeo, etc.)
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              {/* Settings */}
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                Product Settings
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Product Link (Internal Route) *
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  required
                  placeholder="/store/product-id"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Internal route only - use format: /store/product-id
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  <span style={{ fontWeight: 500 }}>Featured (show in top section)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.digital}
                    onChange={(e) => setFormData({ ...formData, digital: e.target.checked })}
                  />
                  <span style={{ fontWeight: 500 }}>Digital Product</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.certification}
                    onChange={(e) => setFormData({ ...formData, certification: e.target.checked })}
                  />
                  <span style={{ fontWeight: 500 }}>Includes Certification</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ fontWeight: 500 }}>Active (visible on store)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <button
                  type="submit"
                  style={{
                    background: '#000',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px'
                  }}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#f0f0f0',
                    color: '#333',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '16px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th style={{ width: '80px' }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Price</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => moveUp(product)}
                        disabled={index === 0}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '12px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.5 : 1
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(product)}
                        disabled={index === products.length - 1}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '12px',
                          cursor: index === products.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === products.length - 1 ? 0.5 : 1
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </td>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      {product.featured && <span style={{ marginLeft: '0.5rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>⭐ FEATURED</span>}
                      {product.badge && <span style={{ marginLeft: '0.5rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{product.badge}</span>}
                    </div>
                  </td>
                  <td>
                    {product.category}
                    {product.subcategory && <div style={{ fontSize: '12px', color: '#666' }}>{product.subcategory}</div>}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: product.digital ? '#e0f2fe' : '#fef3c7',
                      color: product.digital ? '#075985' : '#854d0e'
                    }}>
                      {product.product_type || 'physical'}
                    </span>
                  </td>
                  <td>
                    {product.sale_price ? (
                      <>
                        <div><strong>${product.sale_price.toFixed(2)}</strong></div>
                        <div style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>${product.price.toFixed(2)}</div>
                      </>
                    ) : (
                      <strong>${product.price.toFixed(2)}</strong>
                    )}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: product.is_active ? '#e8f5e9' : '#ffebee',
                      color: product.is_active ? '#2e7d32' : '#c62828'
                    }}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#666',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <h3>No products yet</h3>
            <p>Click "Add Product" to create your first store product.</p>
            <p style={{ fontSize: '14px', marginTop: '1rem' }}>
              All products will be managed in Supabase and use Stripe for checkout.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
