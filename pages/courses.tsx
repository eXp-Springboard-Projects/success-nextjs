import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Link from 'next/link';
import styles from './courses.module.css';

const courses = [
  {
    id: '1',
    title: "Jim Rohn's Foundations for Success",
    category: 'Personal Development',
    duration: '10 modules',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
    description: '10 modules of training with hours of video and audio content from SUCCESS archives',
    instructor: 'Jim Rohn',
    featured: true,
  },
  {
    id: '2',
    title: 'Leadership Masterclass',
    category: 'Leadership',
    duration: '8 modules',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    description: 'Learn how to lead teams effectively and build a culture of excellence',
    instructor: 'SUCCESS Team',
    featured: true,
  },
  {
    id: '3',
    title: 'Personal Development Blueprint',
    category: 'Personal Development',
    duration: '12 modules',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
    description: 'Create a personalized growth plan and achieve your goals faster',
    instructor: 'SUCCESS Coaches',
    featured: false,
  },
];

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Personal Development', 'Leadership', 'Productivity'];
  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  return (
    <Layout>
      <SEO
        title="Courses - SUCCESS+"
        description="Browse our library of personal development courses"
        url="https://www.success.com/courses"
      />

      <div className={styles.coursesPage}>
        <header className={styles.hero}>
          <h1>SUCCESS+ Courses</h1>
          <p>Learn from the best and accelerate your personal growth</p>
        </header>

        <div className={styles.container}>
          {/* Categories */}
          <div className={styles.categories}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={selectedCategory === cat ? styles.categoryActive : styles.category}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className={styles.coursesGrid}>
            {filteredCourses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                {course.featured && <div className={styles.featured}>Featured</div>}
                <div className={styles.thumbnail}>
                  <img src={course.thumbnail} alt={course.title} />
                </div>
                <div className={styles.content}>
                  <div className={styles.category}>{course.category}</div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className={styles.meta}>
                    <span className={styles.instructor}>{course.instructor}</span>
                    <span className={styles.duration}>{course.duration}</span>
                  </div>
                  <a href="https://mysuccessplus.com/shop" className={styles.startButton} target="_blank" rel="noopener noreferrer">
                    Start Course
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
