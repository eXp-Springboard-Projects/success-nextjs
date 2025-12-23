import styles from './MaintenanceBanner.module.css';

export default function MaintenanceBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.text}>Success.com is currently undergoing maintenance</span>
      </div>
    </div>
  );
}
