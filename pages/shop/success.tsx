import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import { useCart } from '../../lib/CartContext';
import styles from './success.module.css';

type SuccessPageProps = {
  sessionId: string;
};

export default function SuccessPage({ sessionId }: SuccessPageProps) {
  const router = useRouter();
  const { clearCart } = useCart();

  // Clear cart on successful order
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <Layout>
      <SEO
        title="Order Successful - SUCCESS Store"
        description="Your order has been placed successfully"
        url="https://www.success.com/shop/success"
      />

      <div className={styles.successPage}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>

            <h1 className={styles.title}>Order Placed Successfully!</h1>

            <p className={styles.message}>
              Thank you for your purchase. Your order has been received and is being processed.
            </p>

            <div className={styles.orderInfo}>
              <h2>What's Next?</h2>
              <ul>
                <li>You will receive an order confirmation email shortly</li>
                <li>We'll send you shipping updates as your order is processed</li>
                <li>Track your order status in your account dashboard</li>
              </ul>
            </div>

            {sessionId && (
              <div className={styles.sessionInfo}>
                <p className={styles.sessionLabel}>Order Reference:</p>
                <p className={styles.sessionId}>{sessionId.slice(0, 24)}...</p>
              </div>
            )}

            <div className={styles.actions}>
              <button
                onClick={() => router.push('/dashboard')}
                className={styles.dashboardButton}
              >
                View Dashboard
              </button>
              <button
                onClick={() => router.push('/store')}
                className={styles.continueButton}
              >
                Continue Shopping
              </button>
            </div>

            <div className={styles.support}>
              <p>Need help? <a href="/contact">Contact our support team</a></p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const sessionId = query.session_id as string || '';

  return {
    props: {
      sessionId,
    },
  };
};
