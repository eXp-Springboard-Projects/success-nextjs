import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './PaywallGate.module.css';

interface PaywallGateProps {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  children: React.ReactNode;
  categories?: { slug: string }[];
  tags?: { slug: string }[];
  isInsiderOnly?: boolean;
  showPreview?: boolean;
}

export default function PaywallGate({
  articleId,
  articleTitle,
  articleUrl,
  children,
  categories = [],
  tags = [],
  isInsiderOnly = false,
  showPreview = true,
}: PaywallGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(false);
  const [articleCount, setArticleCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [requiredTier, setRequiredTier] = useState('COLLECTIVE');
  const [config, setConfig] = useState({
    freeArticleLimit: 3,
    popupTitle: "You've reached your free article limit",
    popupMessage: "Subscribe to SUCCESS+ to get unlimited access to our premium content.",
    ctaButtonText: "Subscribe Now"
  });

  useEffect(() => {
    checkPaywallStatus();
  }, [session, articleId]);

  async function checkPaywallStatus() {
    try {
      // Use new content access API
      const response = await fetch('/api/content/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: articleId,
          contentSlug: articleUrl.split('/').pop(),
          title: articleTitle,
          url: articleUrl,
          categories,
          tags,
          isInsiderOnly,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.canAccess) {
          setIsBlocked(false);
          setShowPaywall(false);
        } else {
          setIsBlocked(true);
          setShowPaywall(true);
          setAccessReason(data.reason || '');
          setRequiredTier(data.requiredTier || 'COLLECTIVE');
        }
      } else {
        // Fail open - don't block on API error
        setIsBlocked(false);
      }

      // Fetch paywall config for display
      const configRes = await fetch('/api/paywall/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }
    } catch (error) {
      // Fail open - don't block on error
      setIsBlocked(false);
    }
  }

  async function trackArticleView(blocked: boolean) {
    try {
      await fetch('/api/paywall/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          articleTitle,
          articleUrl,
          blocked,
          userId: session?.user?.id
        })
      });
    } catch (error) {
    }
  }

  function handleSubscribe() {
    router.push('/subscribe');
  }

  function handleLogin() {
    router.push('/signin');
  }

  if (isBlocked && showPaywall) {
    return (
      <div className={styles.paywallContainer}>
        {/* Show preview of content */}
        {showPreview && (
          <div className={styles.contentPreview}>
            <div className={styles.fade}>
              {children}
            </div>
          </div>
        )}

        {/* Paywall overlay */}
        <div className={styles.paywallOverlay}>
          <div className={styles.paywallModal}>
            <div className={styles.paywallIcon}>
              {isInsiderOnly ? '🌟' : '🔒'}
            </div>
            <h2 className={styles.paywallTitle}>
              {isInsiderOnly
                ? 'Insider Exclusive Content'
                : accessReason === 'login_required'
                ? 'Subscribe to Continue Reading'
                : accessReason === 'article_limit_reached'
                ? "You've reached your free article limit"
                : config.popupTitle}
            </h2>
            <p className={styles.paywallMessage}>
              {isInsiderOnly
                ? 'This premium content is exclusively available to SUCCESS+ Insider members.'
                : accessReason === 'login_required'
                ? 'Sign in or subscribe to access this article and thousands more.'
                : accessReason === 'article_limit_reached'
                ? 'Upgrade to SUCCESS+ for unlimited access to all articles, courses, and magazines.'
                : config.popupMessage}
            </p>

            {/* Membership Tier Options */}
            <div className={styles.tiers}>
              <div className={styles.tier}>
                <h3>SUCCESS+ Insider</h3>
                <p className={styles.price}>
                  <span className={styles.amount}>$7.99</span>
                  <span className={styles.period}>/month</span>
                </p>
                <p className={styles.annualPrice}>Billed monthly ($95.88/year)</p>
                <ul className={styles.features}>
                  <li>✓ 6 Print + 6 Digital magazines/year</li>
                  <li>✓ Exclusive interviews & content</li>
                  <li>✓ Discounted course access</li>
                  <li>✓ E-books, guides & resources</li>
                  <li>✓ Insider Newsletter (4/month)</li>
                </ul>
                <Link href="/subscribe?plan=monthly" className={styles.button}>
                  Subscribe Monthly
                </Link>
              </div>

              <div className={`${styles.tier} ${styles.featured}`}>
                <div className={styles.badge}>Save 22% - Best Value!</div>
                <h3>SUCCESS+ Insider</h3>
                <p className={styles.price}>
                  <span className={styles.amount}>$75</span>
                  <span className={styles.period}>/year</span>
                </p>
                <p className={styles.annualPrice}>Save over $20!</p>
                <ul className={styles.features}>
                  <li>✓ 6 Print + 6 Digital magazines/year</li>
                  <li>✓ Exclusive interviews & content</li>
                  <li>✓ Discounted course access</li>
                  <li>✓ E-books, guides & resources</li>
                  <li>✓ Insider Newsletter (4/month)</li>
                  <li>✓ Legacy video training library</li>
                </ul>
                <Link href="/subscribe?plan=annual" className={styles.button}>
                  Subscribe Annually
                </Link>
              </div>
            </div>

            {accessReason === 'login_required' && !session && (
              <p className={styles.signin}>
                Already a member?{' '}
                <Link href="/auth/signin">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User has access - show full content
  return <>{children}</>;
}
