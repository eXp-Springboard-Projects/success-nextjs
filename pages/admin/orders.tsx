import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Orders.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Order {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  total: number;
  status: string;
  orderSource: string;
  fulfillmentStatus: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  createdAt: string;
  fulfilledAt?: string;
  packingSlipPrinted: boolean;
  order_items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('UNFULFILLED');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [fulfillModal, setFulfillModal] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null,
  });
  const [fulfillForm, setFulfillForm] = useState({
    trackingNumber: '',
    trackingCarrier: 'USPS',
    trackingUrl: '',
    customerNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, statusFilter, sourceFilter, fulfillmentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        orderSource: sourceFilter,
        fulfillmentStatus: fulfillmentFilter,
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const openFulfillModal = (order: Order) => {
    setFulfillModal({ isOpen: true, order });
    setFulfillForm({
      trackingNumber: order.trackingNumber || '',
      trackingCarrier: order.trackingCarrier || 'USPS',
      trackingUrl: order.trackingUrl || '',
      customerNotes: '',
    });
  };

  const closeFulfillModal = () => {
    setFulfillModal({ isOpen: false, order: null });
    setFulfillForm({
      trackingNumber: '',
      trackingCarrier: 'USPS',
      trackingUrl: '',
      customerNotes: '',
    });
  };

  const handleFulfill = async () => {
    if (!fulfillModal.order) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${fulfillModal.order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fulfillForm),
      });

      if (res.ok) {
        showToast('Order fulfilled successfully', 'success');
        closeFulfillModal();
        fetchOrders();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to fulfill order', 'error');
      }
    } catch (error) {
      showToast('Failed to fulfill order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkFulfill = async () => {
    if (selectedOrders.size === 0) {
      showToast('Please select orders to fulfill', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/orders/bulk-fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message, 'success');
        setSelectedOrders(new Set());
        fetchOrders();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to fulfill orders', 'error');
      }
    } catch (error) {
      showToast('Failed to fulfill orders', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const printPackingSlip = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Slip - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Packing Slip</h1>
        <div class="section">
          <strong>Order Number:</strong> ${order.orderNumber}<br>
          <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
          <strong>Customer:</strong> ${order.userName}<br>
          <strong>Email:</strong> ${order.userEmail}<br>
        </div>
        <div class="section">
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <strong>Total: $${order.total.toFixed(2)}</strong>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading orders...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className={styles.ordersPage}>
        <div className={styles.header}>
          <div>
            <h1>Order Fulfillment</h1>
            <p className={styles.subtitle}>
              Manage orders from WooCommerce, Stripe, and in-house systems
            </p>
          </div>
          {selectedOrders.size > 0 && (
            <button onClick={handleBulkFulfill} className={styles.bulkButton} disabled={saving}>
              {saving ? 'Fulfilling...' : `Fulfill ${selectedOrders.size} Selected`}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statContent}>
              <h3>Total Orders</h3>
              <p className={styles.statNumber}>{orders.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statContent}>
              <h3>Unfulfilled</h3>
              <p className={styles.statNumber}>
                {orders.filter(o => o.fulfillmentStatus === 'UNFULFILLED').length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <h3>Fulfilled</h3>
              <p className={styles.statNumber}>
                {orders.filter(o => o.fulfillmentStatus === 'FULFILLED').length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🛒</div>
            <div className={styles.statContent}>
              <h3>WooCommerce</h3>
              <p className={styles.statNumber}>
                {orders.filter(o => o.orderSource === 'WooCommerce').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Fulfillment</option>
              <option value="UNFULFILLED">Unfulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="SHIPPED">Shipped</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Sources</option>
              <option value="WooCommerce">WooCommerce</option>
              <option value="Stripe">Stripe</option>
              <option value="InHouse">In-House</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="SHIPPED">Shipped</option>
            </select>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.tableContainer}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No orders found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Fulfillment</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                      />
                    </td>
                    <td>
                      <div className={styles.orderInfo}>
                        <strong>{order.orderNumber}</strong>
                        <span className={styles.orderDate}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <strong>{order.userName}</strong>
                        <span className={styles.email}>{order.userEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.sourceBadge}>{order.orderSource}</span>
                    </td>
                    <td>{order.order_items.length}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      {order.fulfillmentStatus === 'FULFILLED' ? (
                        <span className={styles.badgeFulfilled}>Fulfilled</span>
                      ) : (
                        <span className={styles.badgeUnfulfilled}>Unfulfilled</span>
                      )}
                    </td>
                    <td>
                      {order.trackingNumber ? (
                        <div className={styles.tracking}>
                          <span className={styles.carrier}>{order.trackingCarrier}</span>
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.trackingLink}
                            >
                              {order.trackingNumber}
                            </a>
                          ) : (
                            <span>{order.trackingNumber}</span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.noTracking}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {order.fulfillmentStatus !== 'FULFILLED' && (
                          <button
                            onClick={() => openFulfillModal(order)}
                            className={styles.fulfillButton}
                          >
                            Fulfill
                          </button>
                        )}
                        <button
                          onClick={() => printPackingSlip(order)}
                          className={styles.printButton}
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fulfill Modal */}
      {fulfillModal.isOpen && fulfillModal.order && (
        <div className={styles.modalOverlay} onClick={closeFulfillModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Fulfill Order {fulfillModal.order.orderNumber}</h2>
              <button onClick={closeFulfillModal} className={styles.modalClose}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.orderSummary}>
                <p><strong>Customer:</strong> {fulfillModal.order.userName}</p>
                <p><strong>Items:</strong> {fulfillModal.order.order_items.length}</p>
                <p><strong>Total:</strong> ${fulfillModal.order.total.toFixed(2)}</p>
              </div>
              <div className={styles.formGroup}>
                <label>Tracking Carrier</label>
                <select
                  value={fulfillForm.trackingCarrier}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, trackingCarrier: e.target.value })}
                  className={styles.input}
                >
                  <option value="USPS">USPS</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={fulfillForm.trackingNumber}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, trackingNumber: e.target.value })}
                  className={styles.input}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tracking URL (optional)</label>
                <input
                  type="url"
                  value={fulfillForm.trackingUrl}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, trackingUrl: e.target.value })}
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Customer Note (optional)</label>
                <textarea
                  value={fulfillForm.customerNotes}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, customerNotes: e.target.value })}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Add a note for the customer..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeFulfillModal} className={styles.cancelButton} disabled={saving}>
                Cancel
              </button>
              <button onClick={handleFulfill} className={styles.saveButton} disabled={saving}>
                {saving ? 'Fulfilling...' : 'Mark as Fulfilled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
