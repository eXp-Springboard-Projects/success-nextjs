/**
 * Social Media Calendar View
 * Visual calendar for scheduled posts
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSocialPosts } from '@/hooks/social/useSocialPosts';
import { SocialPost, PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import styles from './SocialMedia.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function CalendarPage() {
  const { posts, loading } = useSocialPosts({ autoFetch: true });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getPostsForDate = (date: Date): SocialPost[] => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Social Media Calendar</h1>
            <p>View and manage your scheduled posts</p>
          </div>
        </div>

        <div className={styles.calendarHeader}>
          <button onClick={() => navigateMonth('prev')} className={styles.calendarNavButton}>
            ← Previous
          </button>
          <h2>{monthName}</h2>
          <button onClick={() => navigateMonth('next')} className={styles.calendarNavButton}>
            Next →
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className={styles.calendarDayHeader}>
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className={styles.calendarDayEmpty} />;
            }

            const date = new Date(year, month, day);
            const dayPosts = getPostsForDate(date);
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`${styles.calendarDay} ${isToday ? styles.calendarDayToday : ''}`}
              >
                <div className={styles.calendarDayNumber}>{day}</div>
                <div className={styles.calendarDayPosts}>
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={styles.calendarPost}
                      style={{
                        borderLeftColor: PLATFORM_COLORS[post.targetPlatforms[0]],
                      }}
                    >
                      <div className={styles.calendarPostTime}>
                        {new Date(post.scheduledAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className={styles.calendarPostContent}>
                        {post.content.substring(0, 40)}
                        {post.content.length > 40 ? '...' : ''}
                      </div>
                      <div className={styles.calendarPostPlatforms}>
                        {post.targetPlatforms.map((platform) => (
                          <span
                            key={platform}
                            className={styles.platformDot}
                            style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                            title={PLATFORM_NAMES[platform]}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className={styles.calendarPostMore}>
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {loading && <div className={styles.loading}>Loading calendar...</div>}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
