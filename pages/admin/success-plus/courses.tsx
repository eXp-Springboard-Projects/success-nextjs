import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { Plus, Edit, Trash2, Eye, EyeOff, Book, Users } from 'lucide-react';
import styles from './ContentManager.module.css';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail?: string;
  isPublished: boolean;
  enrolledCount: number;
  createdAt: string;
  modules?: number;
}

export default function CoursesManager() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Mock data for now
    setTimeout(() => {
      setCourses([
        {
          id: '1',
          title: 'Leadership Fundamentals',
          description: 'Master the core principles of effective leadership',
          instructor: 'John Maxwell',
          duration: '6 weeks',
          level: 'Beginner',
          category: 'Leadership',
          isPublished: true,
          enrolledCount: 234,
          createdAt: new Date().toISOString(),
          modules: 12,
        },
        {
          id: '2',
          title: 'Advanced Time Management',
          description: 'Productivity strategies for busy professionals',
          instructor: 'Brian Tracy',
          duration: '4 weeks',
          level: 'Advanced',
          category: 'Productivity',
          isPublished: true,
          enrolledCount: 156,
          createdAt: new Date().toISOString(),
          modules: 8,
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    // TODO: API call to toggle publish status
    setCourses(courses.map(c =>
      c.id === id ? { ...c, isPublished: !currentStatus } : c
    ));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    // TODO: API call to delete
    setCourses(courses.filter(c => c.id !== id));
  };

  const filteredCourses = courses.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'published') return c.isPublished;
    if (filter === 'draft') return !c.isPublished;
    return true;
  });

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Courses Manager"
      description="Manage SUCCESS+ courses and learning content"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard/courses" className={styles.previewButton}>
              <Eye size={16} />
              Preview as Member
            </Link>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={() => router.push('/admin/success-plus/courses/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Add New Course
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
          >
            All Courses ({courses.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={filter === 'published' ? styles.filterActive : styles.filterButton}
          >
            Published ({courses.filter(c => c.isPublished).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={filter === 'draft' ? styles.filterActive : styles.filterButton}
          >
            Drafts ({courses.filter(c => !c.isPublished).length})
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Book /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{courses.length}</div>
              <div className={styles.statLabel}>Total Courses</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Users /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {courses.reduce((sum, c) => sum + c.enrolledCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Enrollments</div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className={styles.loading}>Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3>No courses found</h3>
            <p>Get started by creating your first course</p>
            <button
              onClick={() => router.push('/admin/success-plus/courses/new')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              Create Course
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Modules</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className={styles.courseCell}>
                        <div className={styles.courseThumbnail}>
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} />
                          ) : (
                            <div className={styles.placeholderIcon}>📚</div>
                          )}
                        </div>
                        <div>
                          <div className={styles.courseTitle}>{course.title}</div>
                          <div className={styles.courseCategory}>{course.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{course.instructor}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${course.level}`]}`}>
                        {course.level}
                      </span>
                    </td>
                    <td>{course.duration}</td>
                    <td>{course.modules || 0}</td>
                    <td>{course.enrolledCount}</td>
                    <td>
                      <span className={`${styles.badge} ${course.isPublished ? styles.badgeSuccess : styles.badgeDraft}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/success-plus/courses/${course.id}/edit`)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(course.id, course.isPublished)}
                          className={styles.iconButton}
                          title={course.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
