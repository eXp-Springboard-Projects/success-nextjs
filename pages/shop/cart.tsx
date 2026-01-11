import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';
import { useCart } from '../../lib/CartContext';
import styles from './cart.module.css';
import { useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-product-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(`Checkout failed: ${data.error || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  return (
    <Layout>
      <SEO
        title="Shopping Cart - SUCCESS Store"
        description="Review your cart and checkout"
        url="https://www.success.com/shop/cart"
      />

      <div className={styles.cartPage}>
        <div className={styles.container}>
          <h1>Shopping Cart</h1>

          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyIcon}>🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started!</p>
              <button onClick={() => router.push('/store')} className={styles.continueButton}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className={styles.cartContent}>
              {/* Cart Items */}
              <div className={styles.cartItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      <img src={item.thumbnail} alt={item.title} />
                    </div>
                    <div className={styles.itemDetails}>
                      <h3>{item.title}</h3>
                      <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                    </div>
                    <div className={styles.itemQuantity}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={styles.quantityButton}
                      >
                        −
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.itemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className={styles.removeButton}
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className={styles.cartActions}>
                  <button onClick={clearCart} className={styles.clearButton}>
                    Clear Cart
                  </button>
                  <button onClick={() => router.push('/store')} className={styles.continueShoppingButton}>
                    Continue Shopping
                  </button>
                </div>
              </div>

              {/* Cart Summary */}
              <div className={styles.cartSummary}>
                <h2>Order Summary</h2>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Tax (estimated)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {subtotal >= 50 && (
                  <div className={styles.freeShippingBadge}>
                    🎉 You've qualified for free shipping!
                  </div>
                )}
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={styles.checkoutButton}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                <div className={styles.secureCheckout}>
                  🔒 Secure checkout powered by Stripe
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
