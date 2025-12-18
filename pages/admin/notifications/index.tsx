import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './Notifications.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type NotificationType =
  | 'TASK_ASSIGNED'
  | 'MENTION'
  | 'PAYMENT_FAILED'
  | 'SLA_BREACH'
  | 'SYSTEM_ERROR'
  | 'APPROVAL_NEEDED'
  | 'COMMENT_REPLY'
  | 'REPORT_READY';

type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  readAt?: string;
}

interface SystemAlert {
  id: string;
  type: 'Error' | 'Warning' | 'Info' | 'Critical' | 'Success';
  category: string;
  title: string;
  message: string;
  severity: number;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  errorCount: number;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [tab, setTab] = useState<'notifications' | 'alerts'>('notifications');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      fetchSystemAlerts();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
        fetchSystemAlerts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      const res = await fetch('/api/admin/system-alerts');
      if (res.ok) {
        const data = await res.json();
        setSystemAlerts(data);
      }
    } catch (error) {
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await fetch(`/api/admin/system-alerts/${id}/resolve`, { method: 'POST' });
      setSystemAlerts(systemAlerts.map(a =>
        a.id === id ? { ...a, isResolved: true } : a
      ));
    } catch (error) {
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      TASK_ASSIGNED: '📋',
      MENTION: '@',
      PAYMENT_FAILED: '💳',
      SLA_BREACH: '⚠️',
      SYSTEM_ERROR: '🔥',
      APPROVAL_NEEDED: '✋',
      COMMENT_REPLY: '💬',
      REPORT_READY: '📊',
    };
    return icons[type] || '🔔';
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      Error: '❌',
      Warning: '⚠️',
      Info: 'ℹ️',
      Critical: '🚨',
      Success: '✅',
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      LOW: '#6b7280',
      NORMAL: '#3b82f6',
      HIGH: '#f59e0b',
      URGENT: '#ef4444',
    };
    return colors[priority];
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'priority') return n.priority === 'HIGH' || n.priority === 'URGENT';
    return true;
  });

  const unresolvedAlerts = systemAlerts.filter(a => !a.isResolved);

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading notifications...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.notificationsPage}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Notifications Center</h1>
            <p className={styles.subtitle}>
              Real-time notifications and system alerts
            </p>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className={styles.markAllReadBtn}>
                Mark all as read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔔</div>
            <div className={styles.statContent}>
              <h3>Unread</h3>
              <p className={styles.statNumber}>{unreadCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚨</div>
            <div className={styles.statContent}>
              <h3>Critical Alerts</h3>
              <p className={styles.statNumber}>
                {systemAlerts.filter(a => a.type === 'Critical' && !a.isResolved).length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⚠️</div>
            <div className={styles.statContent}>
              <h3>Warnings</h3>
              <p className={styles.statNumber}>
                {systemAlerts.filter(a => a.type === 'Warning' && !a.isResolved).length}
              </p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>Total Today</h3>
              <p className={styles.statNumber}>{notifications.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={tab === 'notifications' ? styles.tabActive : styles.tab}
            onClick={() => setTab('notifications')}
          >
            Notifications
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>
          <button
            className={tab === 'alerts' ? styles.tabActive : styles.tab}
            onClick={() => setTab('alerts')}
          >
            System Alerts
            {unresolvedAlerts.length > 0 && (
              <span className={styles.badgeDanger}>{unresolvedAlerts.length}</span>
            )}
          </button>
        </div>

        {/* Filters */}
        {tab === 'notifications' && (
          <div className={styles.filters}>
            <button
              className={filter === 'all' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={filter === 'unread' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={filter === 'priority' ? styles.filterActive : styles.filterButton}
              onClick={() => setFilter('priority')}
            >
              Priority
            </button>
          </div>
        )}

        {/* Notifications List */}
        {tab === 'notifications' && (
          <div className={styles.notificationsList}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationCard} ${
                    !notification.isRead ? styles.unread : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <h4>{notification.title}</h4>
                      <span
                        className={styles.priorityBadge}
                        style={{ backgroundColor: getPriorityColor(notification.priority) }}
                      >
                        {notification.priority}
                      </span>
                    </div>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <div className={styles.notificationMeta}>
                      <span className={styles.time}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.actionUrl && (
                        <a href={notification.actionUrl} className={styles.actionLink}>
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className={styles.notificationActions}>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className={styles.iconButton}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className={styles.iconButton}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* System Alerts List */}
        {tab === 'alerts' && (
          <div className={styles.alertsList}>
            {systemAlerts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No system alerts</p>
              </div>
            ) : (
              systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`${styles.alertCard} ${
                    alert.isResolved ? styles.resolved : ''
                  } ${styles[`severity${alert.severity}`]}`}
                >
                  <div className={styles.alertIcon}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertHeader}>
                      <h4>{alert.title}</h4>
                      <div className={styles.alertBadges}>
                        <span className={`${styles.typeBadge} ${styles[alert.type.toLowerCase()]}`}>
                          {alert.type}
                        </span>
                        <span className={styles.categoryBadge}>{alert.category}</span>
                        {alert.errorCount > 1 && (
                          <span className={styles.countBadge}>
                            {alert.errorCount}x
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={styles.alertMessage}>{alert.message}</p>
                    <div className={styles.alertMeta}>
                      <span className={styles.time}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      <span className={styles.severity}>
                        Severity: {alert.severity}/5
                      </span>
                    </div>
                  </div>
                  <div className={styles.alertActions}>
                    {!alert.isResolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className={styles.resolveButton}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
