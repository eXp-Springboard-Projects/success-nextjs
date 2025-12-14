import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructorName: string;
  instructorImage: string;
  duration: number;
  level: string;
  category: string;
  totalLessons: number;
  totalModules: number;
  enrolled: boolean;
  progress: number;
  lastAccessedAt: string | null;
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/courses');
    } else if (status === 'authenticated') {
      fetchCourses();
    }
  }, [status]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/dashboard/courses');

      if (response.status === 403) {
        router.push('/subscribe?error=subscription_required');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch('/api/dashboard/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        fetchCourses(); // Refresh courses
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === 'enrolled' && !course.enrolled) return false;
    if (filter === 'available' && course.enrolled) return false;
    if (categoryFilter !== 'all' && course.category !== categoryFilter) return false;
    return true;
  });

  const categories = ['all', ...new Set(courses.map((c) => c.category).filter(Boolean))];

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Courses - SUCCESS+ Dashboard</title>
      </Head>

      <div className={styles.dashboardLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Link href="/dashboard">
              <img src="/success-logo.png" alt="SUCCESS" />
            </Link>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">
              <button><span className={styles.icon}>📊</span> Dashboard</button>
            </Link>
            <Link href="/dashboard/premium">
              <button><span className={styles.icon}>⭐</span> Premium Content</button>
            </Link>
            <Link href="/dashboard/courses">
              <button className={styles.active}><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resources</button>
            </Link>
            <Link href="/dashboard/labs">
              <button><span className={styles.icon}>🔬</span> Success Labs</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events</button>
            </Link>
            <Link href="/dashboard/videos">
              <button><span className={styles.icon}>🎥</span> Videos</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcasts</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazines</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>Courses</h1>
            <p className={styles.subtitle}>Unlock your potential with expert-led courses</p>
          </div>

          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <button
                className={filter === 'all' ? styles.activeFilter : ''}
                onClick={() => setFilter('all')}
              >
                All Courses
              </button>
              <button
                className={filter === 'enrolled' ? styles.activeFilter : ''}
                onClick={() => setFilter('enrolled')}
              >
                My Courses
              </button>
              <button
                className={filter === 'available' ? styles.activeFilter : ''}
                onClick={() => setFilter('available')}
              >
                Available
              </button>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.coursesGrid}>
            {filteredCourses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.courseImage}>
                  <img src={course.thumbnail || '/placeholder-course.jpg'} alt={course.title} />
                  {course.enrolled && (
                    <div className={styles.progressBadge}>{course.progress}% Complete</div>
                  )}
                  <div className={styles.levelBadge}>{course.level}</div>
                </div>
                <div className={styles.courseContent}>
                  <h3>{course.title}</h3>
                  <p className={styles.courseDescription}>{course.description}</p>

                  <div className={styles.courseInstructor}>
                    {course.instructorImage && (
                      <img src={course.instructorImage} alt={course.instructorName} />
                    )}
                    <span>{course.instructorName}</span>
                  </div>

                  <div className={styles.courseMeta}>
                    <span>{course.totalModules} modules</span>
                    <span>{course.totalLessons} lessons</span>
                    <span>{formatDuration(course.duration)}</span>
                  </div>

                  {course.enrolled ? (
                    <>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <button className={styles.continueBtn}>
                        {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.enrollBtn}
                      onClick={() => handleEnroll(course.id)}
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className={styles.emptyState}>
              <p>No courses found matching your filters.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
