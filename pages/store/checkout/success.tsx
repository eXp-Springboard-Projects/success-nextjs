import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import SEO from '../../../components/SEO';
import Link from 'next/link';
import styles from './checkout.module.css';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id) {
      fetchOrderDetails();
    }
  }, [session_id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-session?session_id=${session_id}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Order Successful | SUCCESS Store"
        description="Thank you for your purchase!"
      />

      <div className={styles.checkoutPage}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Confirming your order...</p>
          </div>
        ) : (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h1>Order Successful!</h1>
            <p className={styles.subtitle}>
              Thank you for your purchase. Your order has been confirmed.
            </p>

            {orderDetails && (
              <div className={styles.orderDetails}>
                <h2>Order Details</h2>
                <div className={styles.detailRow}>
                  <span>Order ID:</span>
                  <strong>{orderDetails.id}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Email:</span>
                  <strong>{orderDetails.email}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Total:</span>
                  <strong>${orderDetails.total?.toFixed(2)}</strong>
                </div>
              </div>
            )}

            <div className={styles.nextSteps}>
              <h3>What's Next?</h3>
              <ul>
                <li>📧 Check your email for order confirmation and receipt</li>
                <li>📦 Physical items will ship within 1-2 business days</li>
                <li>💻 Digital products are available immediately in your account</li>
                <li>📚 Courses can be accessed from your dashboard</li>
              </ul>
            </div>

            <div className={styles.actions}>
              <Link href="/account" className={styles.primaryButton}>
                View My Account
              </Link>
              <Link href="/store" className={styles.secondaryButton}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
