import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabaseAdmin } from '../../lib/supabase';
import styles from './PaymentPage.module.css';

interface PayLinkPageProps {
  paylink: {
    id: string;
    title: string;
    description: string | null;
    amount: string;
    currency: string;
    slug: string;
    stripePriceId: string | null;
    requiresShipping: boolean;
  } | null;
  error?: string;
}

export default function PaymentPage({ paylink, error }: PayLinkPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  if (error || !paylink) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h1>Payment Link Not Found</h1>
            <p>{error || 'This payment link is not available, has expired, or reached its maximum uses.'}</p>
            <button onClick={() => router.push('/')} className={styles.homeButton}>
              Return to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    if (paylink.requiresShipping) {
      if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
        alert('Please fill in the shipping address');
        return;
      }
    }

    setLoading(true);

    try {
      // Create Stripe checkout session
      const res = await fetch('/api/pay/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paylinkId: paylink.id,
          customerName,
          customerEmail,
          shippingAddress: paylink.requiresShipping ? shippingAddress : null,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{paylink.title} - SUCCESS Magazine</title>
        <meta name="description" content={paylink.description || `Pay ${paylink.amount} ${paylink.currency}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.paymentCard}>
          {/* Header */}
          <div className={styles.header}>
            <h1>{paylink.title}</h1>
            {paylink.description && (
              <p className={styles.description}>{paylink.description}</p>
            )}
            <div className={styles.amount}>
              <span className={styles.currency}>{paylink.currency}</span>
              <span className={styles.price}>${Number(paylink.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Customer Information</h2>

            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className={styles.input}
                required
                disabled={loading}
              />
              <small>You'll receive a receipt at this email address</small>
            </div>

            {/* Shipping Address (if required) */}
            {paylink.requiresShipping && (
              <>
                <h3 className={styles.sectionTitle}>Shipping Address</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="line1">Address Line 1 *</label>
                  <input
                    id="line1"
                    type="text"
                    value={shippingAddress.line1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                    placeholder="123 Main St"
                    className={styles.input}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="line2">Address Line 2</label>
                  <input
                    id="line2"
                    type="text"
                    value={shippingAddress.line2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                    placeholder="Apt, Suite, etc. (optional)"
                    className={styles.input}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="New York"
                      className={styles.input}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="state">State *</label>
                    <input
                      id="state"
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="NY"
                      className={styles.input}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="postal_code">ZIP Code *</label>
                    <input
                      id="postal_code"
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                      placeholder="10001"
                      className={styles.input}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="country">Country *</label>
                    <select
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className={styles.input}
                      required
                      disabled={loading}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>🔒</span>
                  Pay ${Number(paylink.amount).toFixed(2)}
                </>
              )}
            </button>

            <p className={styles.secureText}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure payment powered by Stripe
            </p>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p>By completing this purchase, you agree to our Terms of Service and Privacy Policy.</p>
            <p className={styles.powered}>Powered by SUCCESS Magazine</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    const supabase = supabaseAdmin();
    const { data: paylink, error } = await supabase
      .from('pay_links')
      .select('id, title, description, amount, currency, slug, status, stripePriceId, currentUses, maxUses, expiresAt, requiresShipping')
      .eq('slug', slug)
      .single();

    if (!paylink || error) {
      return {
        props: {
          paylink: null,
          error: 'Payment link not found',
        },
      };
    }

    // Check if paylink is active
    if (paylink.status !== 'ACTIVE') {
      return {
        props: {
          paylink: null,
          error: 'This payment link is no longer active',
        },
      };
    }

    // Check if expired
    if (paylink.expiresAt && new Date(paylink.expiresAt) < new Date()) {
      return {
        props: {
          paylink: null,
          error: 'This payment link has expired',
        },
      };
    }

    // Check if max uses reached
    if (paylink.maxUses && paylink.currentUses >= paylink.maxUses) {
      return {
        props: {
          paylink: null,
          error: 'This payment link has reached its maximum number of uses',
        },
      };
    }

    // Convert Decimal to string for JSON serialization
    const { amount, ...rest } = paylink;

    return {
      props: {
        paylink: {
          ...rest,
          amount: amount.toString(),
        },
      },
    };
  } catch (error) {
    return {
      props: {
        paylink: null,
        error: 'An error occurred while loading this payment link',
      },
    };
  }
};
