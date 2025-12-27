import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import discStyles from './disc-profile.module.css';

interface DISCResult {
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
  primaryType: 'D' | 'I' | 'S' | 'C';
  description: string;
  strengths: string[];
  challenges: string[];
  completedAt: string | null;
}

export default function DISCProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [discResult, setDiscResult] = useState<DISCResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?redirect=/dashboard/disc-profile');
    } else if (status === 'authenticated') {
      fetchDISCProfile();
    }
  }, [status]);

  const fetchDISCProfile = async () => {
    try {
      const response = await fetch('/api/dashboard/disc-profile');

      if (response.ok) {
        const data = await response.json();
        setDiscResult(data);
      }
    } catch (error) {
      console.error('Error fetching DISC profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'D': return '#e74c3c';
      case 'I': return '#f39c12';
      case 'S': return '#27ae60';
      case 'C': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'D': return 'Dominance';
      case 'I': return 'Influence';
      case 'S': return 'Steadiness';
      case 'C': return 'Conscientiousness';
      default: return '';
    }
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>My DISC Profile - SUCCESS+</title>
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
              <button><span className={styles.icon}>🎓</span> Courses</button>
            </Link>
            <Link href="/dashboard/disc-profile">
              <button className={styles.active}><span className={styles.icon}>🎯</span> My DISC Profile</button>
            </Link>
            <Link href="/dashboard/resources">
              <button><span className={styles.icon}>📚</span> Resource Library</button>
            </Link>
            <Link href="/dashboard/community">
              <button><span className={styles.icon}>👥</span> Community</button>
            </Link>
            <Link href="/dashboard/events">
              <button><span className={styles.icon}>📅</span> Events Calendar</button>
            </Link>
            <Link href="/dashboard/magazines">
              <button><span className={styles.icon}>📖</span> Magazine</button>
            </Link>
            <Link href="/dashboard/podcasts">
              <button><span className={styles.icon}>🎙️</span> Podcast</button>
            </Link>
            <Link href="/dashboard/shop">
              <button><span className={styles.icon}>🛍️</span> Shop</button>
            </Link>
            <Link href="/dashboard/help">
              <button><span className={styles.icon}>❓</span> Help Center</button>
            </Link>
            <Link href="/dashboard/billing">
              <button><span className={styles.icon}>💳</span> Billing & Orders</button>
            </Link>
            <Link href="/dashboard/settings">
              <button><span className={styles.icon}>⚙️</span> Settings</button>
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.header}>
            <h1>My DISC Profile</h1>
            <p className={styles.subtitle}>Understand your behavioral style and unlock your potential</p>
          </div>

          {!discResult?.completedAt ? (
            <div className={discStyles.assessmentPrompt}>
              <div className={discStyles.promptCard}>
                <div className={discStyles.promptIcon}>🎯</div>
                <h2>Discover Your DISC Personality Type</h2>
                <p>
                  The DISC assessment helps you understand your natural behavioral tendencies,
                  communication style, and work preferences. This insight can improve your
                  relationships, career growth, and personal development.
                </p>
                <div className={discStyles.discTypes}>
                  <div className={discStyles.typePreview} style={{ borderColor: '#e74c3c' }}>
                    <strong>D - Dominance</strong>
                    <p>Direct, results-oriented, decisive</p>
                  </div>
                  <div className={discStyles.typePreview} style={{ borderColor: '#f39c12' }}>
                    <strong>I - Influence</strong>
                    <p>Enthusiastic, optimistic, collaborative</p>
                  </div>
                  <div className={discStyles.typePreview} style={{ borderColor: '#27ae60' }}>
                    <strong>S - Steadiness</strong>
                    <p>Patient, loyal, supportive</p>
                  </div>
                  <div className={discStyles.typePreview} style={{ borderColor: '#3498db' }}>
                    <strong>C - Conscientiousness</strong>
                    <p>Analytical, precise, systematic</p>
                  </div>
                </div>
                <button
                  className={discStyles.takeAssessmentBtn}
                  onClick={() => window.open('https://mysuccessplus.com/disc-assessment', '_blank')}
                >
                  Take DISC Assessment
                </button>
                <p className={discStyles.timeNote}>⏱️ Takes approximately 10-15 minutes</p>
              </div>
            </div>
          ) : (
            <div className={discStyles.resultsContainer}>
              <div className={discStyles.primaryTypeCard} style={{ borderColor: getTypeColor(discResult.primaryType) }}>
                <div className={discStyles.typeHeader}>
                  <div className={discStyles.typeLetter} style={{ backgroundColor: getTypeColor(discResult.primaryType) }}>
                    {discResult.primaryType}
                  </div>
                  <div>
                    <h2>{getTypeName(discResult.primaryType)}</h2>
                    <p>Your Primary Behavioral Style</p>
                  </div>
                </div>
                <p className={discStyles.typeDescription}>{discResult.description}</p>
              </div>

              <div className={discStyles.scoresGrid}>
                <div className={discStyles.scoreCard}>
                  <div className={discStyles.scoreHeader} style={{ color: '#e74c3c' }}>
                    <span className={discStyles.scoreLetter}>D</span>
                    <span>Dominance</span>
                  </div>
                  <div className={discStyles.scoreBar}>
                    <div
                      className={discStyles.scoreFill}
                      style={{ width: `${discResult.dominance}%`, backgroundColor: '#e74c3c' }}
                    ></div>
                  </div>
                  <div className={discStyles.scoreValue}>{discResult.dominance}%</div>
                </div>

                <div className={discStyles.scoreCard}>
                  <div className={discStyles.scoreHeader} style={{ color: '#f39c12' }}>
                    <span className={discStyles.scoreLetter}>I</span>
                    <span>Influence</span>
                  </div>
                  <div className={discStyles.scoreBar}>
                    <div
                      className={discStyles.scoreFill}
                      style={{ width: `${discResult.influence}%`, backgroundColor: '#f39c12' }}
                    ></div>
                  </div>
                  <div className={discStyles.scoreValue}>{discResult.influence}%</div>
                </div>

                <div className={discStyles.scoreCard}>
                  <div className={discStyles.scoreHeader} style={{ color: '#27ae60' }}>
                    <span className={discStyles.scoreLetter}>S</span>
                    <span>Steadiness</span>
                  </div>
                  <div className={discStyles.scoreBar}>
                    <div
                      className={discStyles.scoreFill}
                      style={{ width: `${discResult.steadiness}%`, backgroundColor: '#27ae60' }}
                    ></div>
                  </div>
                  <div className={discStyles.scoreValue}>{discResult.steadiness}%</div>
                </div>

                <div className={discStyles.scoreCard}>
                  <div className={discStyles.scoreHeader} style={{ color: '#3498db' }}>
                    <span className={discStyles.scoreLetter}>C</span>
                    <span>Conscientiousness</span>
                  </div>
                  <div className={discStyles.scoreBar}>
                    <div
                      className={discStyles.scoreFill}
                      style={{ width: `${discResult.conscientiousness}%`, backgroundColor: '#3498db' }}
                    ></div>
                  </div>
                  <div className={discStyles.scoreValue}>{discResult.conscientiousness}%</div>
                </div>
              </div>

              <div className={discStyles.insightsGrid}>
                <div className={discStyles.insightCard}>
                  <h3>💪 Your Strengths</h3>
                  <ul>
                    {discResult.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className={discStyles.insightCard}>
                  <h3>🎯 Areas for Growth</h3>
                  <ul>
                    {discResult.challenges.map((challenge, index) => (
                      <li key={index}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={discStyles.actionSection}>
                <h3>Next Steps</h3>
                <div className={discStyles.actionCards}>
                  <Link href="/dashboard/courses" className={discStyles.actionCard}>
                    <span className={discStyles.actionIcon}>🎓</span>
                    <div>
                      <h4>Recommended Courses</h4>
                      <p>Courses tailored to your DISC type</p>
                    </div>
                  </Link>
                  <button
                    className={discStyles.actionCard}
                    onClick={() => window.open('https://mysuccessplus.com/disc-report', '_blank')}
                  >
                    <span className={discStyles.actionIcon}>📄</span>
                    <div>
                      <h4>Download Full Report</h4>
                      <p>Get your complete DISC analysis</p>
                    </div>
                  </button>
                  <button
                    className={discStyles.actionCard}
                    onClick={() => window.open('https://mysuccessplus.com/disc-assessment', '_blank')}
                  >
                    <span className={discStyles.actionIcon}>🔄</span>
                    <div>
                      <h4>Retake Assessment</h4>
                      <p>Update your profile</p>
                    </div>
                  </button>
                </div>
              </div>
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
