import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../lib/CartContext';
import styles from './Header.module.css';

const navItems = [
  { label: 'MAGAZINE', path: '/magazine' },
  { label: 'COACHING', path: '/coaching' },
  { label: 'LABS', path: 'https://labs.success.com/', external: true },
  { label: 'SUCCESS+', path: '/success-plus' },
  { label: 'PROFESSIONAL GROWTH', path: '/category/professional-growth' },
  { label: 'AI & TECHNOLOGY', path: '/category/ai-technology' },
  { label: 'BUSINESS & BRANDING', path: '/category/business-branding' },
  { label: 'STORE', path: '/store' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { itemCount } = useCart();

  return (
    <header className={styles.header}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <Link href="/newsletter" className={styles.newsletterLink}>
            SIGN UP FOR NEWSLETTER
          </Link>
          <div className={styles.topBarButtons}>
            <Link href="/search" className={styles.searchButtonTop} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/shop/cart" className={styles.cartButton} aria-label="Shopping Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2L7 6H3L7 20H17L21 6H17L15 2H9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11V16M15 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
            </Link>
            <Link href="/login" className={styles.signInButton}>
              SIGN IN
            </Link>
            <Link href="/subscriptions" className={styles.subscribeButton}>
              SUBSCRIBE
            </Link>
          </div>
        </div>
      </div>

      {/* Logo Bar - Centered */}
      <div className={styles.logoBar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/success-logo.svg"
              alt="SUCCESS Magazine"
              width={800}
              height={200}
              priority
              style={{ width: 'auto', height: '280px', maxHeight: '280px' }}
            />
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={styles.navBar}>
        <div className={styles.container}>
          <button
            className={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
            <ul>
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a href={item.path} rel="noopener noreferrer">
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.path}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
