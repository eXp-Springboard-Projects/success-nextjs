import { useState } from 'react';
import styles from './EventCalendar.module.css';

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  eventType: string;
  description: string;
  isRegistered: boolean;
}

interface EventCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'list'>('month');

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className={styles.calendarDay + ' ' + styles.empty}></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      calendarDays.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${isToday ? styles.today : ''} ${
            dayEvents.length > 0 ? styles.hasEvents : ''
          }`}
        >
          <div className={styles.dayNumber}>{day}</div>
          <div className={styles.dayEvents}>
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className={`${styles.eventDot} ${event.isRegistered ? styles.registered : ''}`}
                onClick={() => onEventClick(event)}
                title={event.title}
              >
                <span className={styles.eventTitle}>{event.title}</span>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className={styles.moreEvents}>+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (view === 'list') {
    return (
      <div className={styles.container}>
        <div className={styles.calendarHeader}>
          <button onClick={() => setView('month')} className={styles.viewToggle}>
            📅 Calendar View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.calendarHeader}>
        <button onClick={previousMonth} className={styles.navButton}>
          ‹
        </button>
        <h2 className={styles.monthTitle}>{monthName}</h2>
        <button onClick={nextMonth} className={styles.navButton}>
          ›
        </button>
        <button onClick={today} className={styles.todayButton}>
          Today
        </button>
        <button onClick={() => setView('list')} className={styles.viewToggle}>
          📋 List View
        </button>
      </div>

      <div className={styles.calendarGrid}>
        <div className={styles.weekday}>Sun</div>
        <div className={styles.weekday}>Mon</div>
        <div className={styles.weekday}>Tue</div>
        <div className={styles.weekday}>Wed</div>
        <div className={styles.weekday}>Thu</div>
        <div className={styles.weekday}>Fri</div>
        <div className={styles.weekday}>Sat</div>

        {renderCalendar()}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.registered}`}></div>
          <span>Registered</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot}></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}
