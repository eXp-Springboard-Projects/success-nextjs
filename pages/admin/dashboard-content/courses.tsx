import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from './DashboardContent.module.css';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration?: string;
  level?: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    duration: '',
    level: 'beginner',
    isPublished: false,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/dashboard/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const res = await fetch('/api/admin/dashboard-content/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          thumbnail: '',
          duration: '',
          level: 'beginner',
          isPublished: false,
        });
        fetchCourses();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course');
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/dashboard-content/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const res = await fetch(`/api/admin/dashboard-content/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Manage Courses"
      description="Create and manage SUCCESS+ courses"
    >
      <div className={styles.contentManagement}>
        {/* Header */}
        <div className={styles.contentHeader}>
          <Link href="/admin/dashboard-content" className={styles.backLink}>
            ← Back to Dashboard Content
          </Link>
          <button onClick={() => setShowForm(true)} className={styles.createButton}>
            + Add New Course
          </button>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Create New Course</h2>
                <button onClick={() => setShowForm(false)} className={styles.closeBtn}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Course Title *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter course title"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description *</label>
                    <textarea
                      className={styles.textarea}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter course description"
                      rows={4}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Thumbnail URL</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Duration</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 4 hours"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Level</label>
                      <select
                        className={styles.select}
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      />
                      <span>Publish immediately</span>
                    </label>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={uploading}>
                    {uploading ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className={styles.contentTable}>
          {loading ? (
            <div className={styles.loading}>Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>No courses yet</h3>
              <p>Create your first course to get started</p>
              <button onClick={() => setShowForm(true)} className={styles.createButton}>
                + Add New Course
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className={styles.courseInfo}>
                        {course.thumbnail && (
                          <img src={course.thumbnail} alt={course.title} className={styles.thumbnail} />
                        )}
                        <div>
                          <div className={styles.courseTitle}>{course.title}</div>
                          <div className={styles.courseDesc}>{course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.levelBadge}>{course.level}</span>
                    </td>
                    <td>{course.duration || '-'}</td>
                    <td>
                      {course.isPublished ? (
                        <span className={styles.statusPublished}>Published</span>
                      ) : (
                        <span className={styles.statusDraft}>Draft</span>
                      )}
                    </td>
                    <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => togglePublish(course.id, course.isPublished)}
                          className={styles.actionButton}
                          title={course.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {course.isPublished ? '👁️' : '🔒'}
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className={styles.actionButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
