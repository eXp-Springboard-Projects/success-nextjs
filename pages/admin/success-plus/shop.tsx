import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { Plus, Edit, Trash2, Eye, EyeOff, ShoppingBag, DollarSign } from 'lucide-react';
import styles from './ContentManager.module.css';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  thumbnail?: string;
  isPublished: boolean;
  salesCount: number;
  createdAt: string;
  featured?: boolean;
}

export default function ShopManager() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Mock data for now
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          title: 'SUCCESS Magazine Annual Subscription',
          description: '12 issues delivered to your door',
          price: 29.99,
          category: 'Subscriptions',
          sku: 'SUB-MAG-001',
          stock: 999,
          isPublished: true,
          salesCount: 1234,
          createdAt: new Date().toISOString(),
          featured: true,
        },
        {
          id: '2',
          title: 'The Ultimate Success Planner',
          description: 'Plan your path to success with our premium planner',
          price: 39.99,
          category: 'Planners',
          sku: 'PLN-001',
          stock: 156,
          isPublished: true,
          salesCount: 567,
          createdAt: new Date().toISOString(),
          featured: false,
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    // TODO: API call to toggle publish status
    setProducts(products.map(p =>
      p.id === id ? { ...p, isPublished: !currentStatus } : p
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    // TODO: API call to delete
    setProducts(products.filter(p => p.id !== id));
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'published') return p.isPublished;
    if (filter === 'draft') return !p.isPublished;
    return true;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Shop Manager"
      description="Manage SUCCESS+ shop products and inventory"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/shop" className={styles.previewButton}>
              <Eye size={16} />
              Preview as Member
            </Link>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={() => router.push('/admin/success-plus/shop/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add New Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={filter === 'published' ? styles.filterActive : styles.filterButton}
          >
            Published ({products.filter(p => p.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterActive : styles.filterButton}
          >
            Drafts ({products.filter(p => !p.isPublished).length})
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><ShoppingBag /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{products.length}</div>
              <div className={styles.statLabel}>Total Products</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><DollarSign /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {products.reduce((sum, p) => sum + p.salesCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Sales</div>
            </div>
          </div>
        </div>

        {/* Products List */}
        {loading ? (
          <div className={styles.loading}>Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛍️</div>
            <h3>No products found</h3>
            <p>Get started by adding your first product</p>
            <button
              onClick={() => router.push('/admin/success-plus/shop/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sales</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.courseCell}>
                        <div className={styles.courseThumbnail}>
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.title} />
                          ) : (
                            <div className={styles.placeholderIcon}>🛍️</div>
                          )}
                        </div>
                        <div>
                          <div className={styles.courseTitle}>{product.title}</div>
                          <div className={styles.courseCategory}>{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.badge} ${product.stock > 50 ? styles.badgeSuccess : product.stock > 0 ? styles.badgeIntermediate : styles.badgeDraft}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td>{product.salesCount}</td>
                    <td>
                      <span className={`${styles.badge} ${product.isPublished ? styles.badgeSuccess : styles.badgeDraft}`}>
                        {product.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/success-plus/shop/${product.id}/edit`)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(product.id, product.isPublished)}
                          className={styles.iconButton}
                          title={product.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {product.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
