// About Us Page - Video Hero, Timeline, Team Members
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import AboutHistory from '../components/AboutHistory';
import TeamMember from '../components/TeamMember';
import styles from './About.module.css';
import { GetServerSideProps } from 'next';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  linkedIn?: string;
  displayOrder: number;
}

interface AboutPageProps {
  teamMembers: TeamMember[];
}

export default function AboutPage({ teamMembers }: AboutPageProps) {
  return (
    <Layout>
      <SEO
        title="About Us | SUCCESS"
        description="Unlike any other time in human history, people need to continually keep up with expanding knowledge and perpetually develop new skills to stay relevant"
        url="https://www.success.com/about-us"
      />

      <div className={styles.about}>
        {/* Hero Video Section */}
        <section className={styles.hero}>
          <div className={styles.videoWrapper}>
            <iframe
              src="https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              className={styles.video}
              title="SUCCESS About Us Video"
            />
          </div>
        </section>

        {/* History Timeline */}
        <AboutHistory />

        {/* Meet the Team Section */}
        <section className={styles.teamSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.verticalText}>meet the team</span>
            </h2>

            <div className={styles.teamGrid}>
              {teamMembers.map((member) => (
                <TeamMember
                  key={member.id}
                  name={member.name}
                  title={member.title}
                  bio={member.bio}
                  image={member.image}
                  linkedIn={member.linkedIn || ''}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch team members from API
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/team-members`);

    if (!res.ok) {
      throw new Error('Failed to fetch team members');
    }

    const teamMembers = await res.json();

    return {
      props: {
        teamMembers,
      },
    };
  } catch (error) {
    console.error('Error fetching team members:', error);

    // Return empty array if fetch fails
    return {
      props: {
        teamMembers: [],
      },
    };
  }
};
