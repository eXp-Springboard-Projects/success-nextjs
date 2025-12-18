import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './TrialStatusBanner.module.css';

interface TrialStatus {
  isTrialActive: boolean;
  trialEndsAt: string | null;
  daysRemaining: number;
  membershipTier: string;
}

export default function TrialStatusBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/user/trial-status');
      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trialStatus?.isTrialActive) {
    return null;
  }

  const { daysRemaining, trialEndsAt } = trialStatus;
  const urgency = daysRemaining <= 2 ? 'urgent' : daysRemaining <= 4 ? 'warning' : 'active';

  return (
    <div className={`${styles.banner} ${styles[urgency]}`}>
      <div className={styles.content}>
        <div className={styles.icon}>🎁</div>
        <div className={styles.info}>
          <h3 className={styles.title}>
            FREE TRIAL - {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining
          </h3>
          <p className={styles.subtitle}>
            Your trial ends on {new Date(trialEndsAt!).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link href="/upgrade" className={styles.upgradeButton}>
          Upgrade Now
        </Link>
      </div>
      {daysRemaining <= 2 && (
        <div className={styles.urgentMessage}>
          ⚠️ Your trial is expiring soon! Upgrade now to keep your access to premium content.
        </div>
      )}
    </div>
  );
}
