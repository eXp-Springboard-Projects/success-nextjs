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
  image: string;
  category: string;
  subcategory?: string;
  link: string;
  featured: boolean;
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
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    image: '',
    category: 'Books',
    subcategory: '',
    link: '',
    featured: false,
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
      const url = '/api/admin/store-products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = editingProduct
        ? { ...formData, id: editingProduct.id }
        : formData;

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
      image: product.image,
      category: product.category,
      subcategory: product.subcategory || '',
      link: product.link,
      featured: product.featured,
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
      image: '',
      category: 'Books',
      subcategory: '',
      link: '',
      featured: false,
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

    // Swap display orders
    await updateDisplayOrder(product.id, prevProduct.display_order);
    await updateDisplayOrder(prevProduct.id, product.display_order);
    await fetchProducts();
  };

  const moveDown = async (product: StoreProduct) => {
    const currentIndex = products.findIndex(p => p.id === product.id);
    if (currentIndex === products.length - 1) return;

    const nextProduct = products[currentIndex + 1];

    // Swap display orders
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
            <p className={styles.subtitle}>Manage products displayed on the /store page</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.newButton}
          >
            {showForm ? 'Cancel' : 'Add Product'}
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
            <h2 style={{ marginTop: 0 }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit}>
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
                    Sale Price (optional)
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
                    Subcategory (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., Jim Rohn, Success Classics"
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Product Image URL *
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
                  Product Link URL *
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  required
                  placeholder="https://mysuccessplus.com/product/..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  Featured (show in top 4)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active (show on store page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    background: '#000',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#f0f0f0',
                    color: '#333',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th style={{ width: '80px' }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '250px' }}>Actions</th>
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
                    </div>
                  </td>
                  <td>
                    {product.category}
                    {product.subcategory && <div style={{ fontSize: '12px', color: '#666' }}>{product.subcategory}</div>}
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
                          padding: '0.5rem 1rem',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
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
            padding: '3rem',
            color: '#666'
          }}>
            No products yet. Click "Add Product" to get started.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
