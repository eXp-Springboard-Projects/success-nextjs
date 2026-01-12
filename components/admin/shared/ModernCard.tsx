import React, { ReactNode } from 'react';
import styles from './ModernCard.module.css';

interface ModernCardProps {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'illustration' | 'stat' | 'update';
  gradient?: 'purple' | 'blue' | 'pink' | 'orange' | 'navy';
  size?: 'small' | 'medium' | 'large' | 'wide';
  className?: string;
}

export function ModernCard({
  children,
  variant = 'default',
  gradient,
  size = 'medium',
  className = ''
}: ModernCardProps) {
  const classes = [
    styles.card,
    styles[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    gradient && styles[`gradient${gradient.charAt(0).toUpperCase() + gradient.slice(1)}`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    className
  ].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}

interface StatCardProps {
  icon: string | ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  gradient?: 'purple' | 'blue' | 'pink' | 'orange';
}

export function StatCard({ icon, label, value, change, changeType = 'neutral', gradient }: StatCardProps) {
  return (
    <ModernCard variant="stat" gradient={gradient}>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <div className={`${styles.statIcon} ${gradient ? styles[`icon${gradient.charAt(0).toUpperCase() + gradient.slice(1)}`] : ''}`}>
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        </div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{value}</div>
          <div className={styles.statLabel}>{label}</div>
          {change && (
            <div className={`${styles.statChange} ${styles[`change${changeType.charAt(0).toUpperCase() + changeType.slice(1)}`]}`}>
              {change}
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  );
}

interface IllustrationCardProps {
  title: string;
  description?: string;
  image?: string;
  gradient?: 'purple' | 'blue' | 'pink' | 'orange' | 'navy';
  size?: 'medium' | 'large' | 'wide';
}

export function IllustrationCard({ title, description, image, gradient = 'blue', size = 'medium' }: IllustrationCardProps) {
  return (
    <ModernCard variant="illustration" gradient={gradient} size={size}>
      <div className={styles.illustrationCard}>
        <div className={styles.illustrationContent}>
          <h3 className={styles.illustrationTitle}>{title}</h3>
          {description && <p className={styles.illustrationDescription}>{description}</p>}
        </div>
        {image && (
          <div className={styles.illustrationImage}>
            <img src={image} alt={title} />
          </div>
        )}
      </div>
    </ModernCard>
  );
}

interface UpdateCardProps {
  icon: string | ReactNode;
  title: string;
  value: string | number;
  trend?: 'up' | 'down';
  color?: string;
}

export function UpdateCard({ icon, title, value, trend, color }: UpdateCardProps) {
  return (
    <div className={styles.updateCard}>
      <div className={styles.updateIcon} style={{ backgroundColor: color || '#3b82f6' }}>
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>
      <div className={styles.updateContent}>
        <div className={styles.updateTitle}>{title}</div>
        <div className={styles.updateValue}>
          {trend && <span className={styles[`trend${trend.charAt(0).toUpperCase() + trend.slice(1)}`]}>
            {trend === 'up' ? '↑' : '↓'}
          </span>}
          {value}
        </div>
      </div>
    </div>
  );
}

interface ProgressCardProps {
  title: string;
  progress: number;
  total?: number;
  color?: string;
}

export function ProgressCard({ title, progress, total, color = '#3b82f6' }: ProgressCardProps) {
  const percentage = total ? (progress / total) * 100 : progress;

  return (
    <ModernCard variant="default">
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <div className={styles.progressTitle}>{title}</div>
          <div className={styles.progressValue}>{Math.round(percentage)}%</div>
        </div>
        <div className={styles.progressCircle}>
          <svg viewBox="0 0 100 100" className={styles.progressSvg}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${(percentage / 100) * 283} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className={styles.progressText}>{Math.round(percentage)}%</div>
        </div>
      </div>
    </ModernCard>
  );
}
