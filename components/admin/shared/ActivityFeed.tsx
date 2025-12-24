import { useState, useEffect } from 'react';
import { Department } from '@/lib/types';
import ActivityItem from './ActivityItem';
import styles from './ActivityFeed.module.css';

interface Activity {
  id: string;
  userName: string;
  action: string;
  description?: string;
  entityType?: string;
  department?: Department;
  createdAt: string;
}

interface ActivityFeedProps {
  department?: Department | 'all';
  limit?: number;
  showFilters?: boolean;
}

export default function ActivityFeed({
  department = 'all',
  limit = 20,
  showFilters = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Department | 'all'>(department);

  useEffect(() => {
    fetchActivities();
  }, [filter, limit]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('department', filter);
      }
      params.append('limit', limit.toString());

      const res = await fetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const groupByTime = (activities: Activity[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, Activity[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    activities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      if (activityDate >= today) {
        groups.Today.push(activity);
      } else if (activityDate >= yesterday) {
        groups.Yesterday.push(activity);
      } else if (activityDate >= weekAgo) {
        groups['This Week'].push(activity);
      } else {
        groups.Older.push(activity);
      }
    });

    return groups;
  };

  const grouped = groupByTime(activities);

  return (
    <div className={styles.activityFeed}>
      {showFilters && (
        <div className={styles.filters}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Department | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All Departments</option>
            <option value="CUSTOMER_SERVICE">Customer Service</option>
            <option value="EDITORIAL">Editorial</option>
            <option value="SUCCESS_PLUS">SUCCESS+</option>
            <option value="COACHING">Coaching</option>
            <option value="MARKETING">Marketing</option>
            <option value="DEV">Dev</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>=í</div>
          <div>No activity to display</div>
        </div>
      ) : (
        <div className={styles.groupedActivities}>
          {Object.entries(grouped).map(([period, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={period} className={styles.periodGroup}>
                <h3 className={styles.periodTitle}>{period}</h3>
                <div className={styles.activitiesList}>
                  {items.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
