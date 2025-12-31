import { useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './SuccessPlus.module.css';

interface Tier {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  stripePriceId: string;
}

export default function TiersManagement() {
  const tiers: Tier[] = [
    {
      id: 'insider',
      name: 'SUCCESS+ Insider',
      price: 7.99,
      interval: 'month',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_monthly',
      features: [
        'Full access to SUCCESS+ premium content',
        'Exclusive articles and interviews',
        'Digital tools and resources',
        'Members-only webinars',
        'Community access',
        'Physical SUCCESS Magazine subscription',
        'Priority support',
      ],
    },
    {
      id: 'insider-annual',
      name: 'SUCCESS+ Insider (Annual)',
      price: 79.99,
      interval: 'year',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'price_yearly',
      features: [
        'Full access to SUCCESS+ premium content',
        'Exclusive articles and interviews',
        'Digital tools and resources',
        'Members-only webinars',
        'Community access',
        'Physical SUCCESS Magazine subscription',
        'Priority support',
        'Save $15.89/year vs monthly',
      ],
    },
  ];

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Tiers"
      description="View and manage SUCCESS+ subscription tiers"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Subscription Tiers</h1>
          <p className={styles.subtitle}>
            To edit pricing and features, please visit your{' '}
            <a
              href="https://dashboard.stripe.com/products"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.stripeLink}
            >
              Stripe Dashboard
            </a>
          </p>
        </div>

        <div className={styles.tiersGrid}>
          {tiers.map((tier) => (
            <div key={tier.id} className={styles.tierCard}>
              <div className={styles.tierHeader}>
                <h2 className={styles.tierName}>{tier.name}</h2>
                <div className={styles.tierPrice}>
                  <span className={styles.price}>${tier.price}</span>
                  <span className={styles.interval}>/{tier.interval}</span>
                </div>
              </div>

              <div className={styles.tierFeatures}>
                <h3>Features:</h3>
                <ul>
                  {tier.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.tierMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Stripe Price ID:</span>
                  <code className={styles.metaValue}>{tier.stripePriceId}</code>
                </div>
              </div>

              <a
                href={`https://dashboard.stripe.com/products/${tier.stripePriceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.manageButton}
              >
                Manage in Stripe →
              </a>
            </div>
          ))}
        </div>

        <div className={styles.infoBox}>
          <h3>📝 How to Edit Tiers</h3>
          <ol>
            <li>Click "Manage in Stripe" on any tier above</li>
            <li>Update pricing, features, or billing intervals in Stripe</li>
            <li>Changes will automatically sync to SUCCESS+</li>
            <li>Update environment variables if you create new price IDs</li>
          </ol>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
