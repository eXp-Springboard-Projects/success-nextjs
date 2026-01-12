// About Us Page - matches SUCCESS.com/about-us exactly
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import AboutHistory from '../components/AboutHistory';
import TeamMember from '../components/TeamMember';
import styles from './About.module.css';
import { supabaseAdmin } from '../lib/supabase';

interface TeamMemberData {
  name: string;
  title: string;
  bio: string;
  image: string;
  linkedIn?: string;
}

interface HistoryItem {
  year: string;
  description: string;
}

interface AboutPageProps {
  teamMembers: TeamMemberData[];
  heroVideoUrl: string;
  historyItems: HistoryItem[];
}

export default function AboutPage({ teamMembers, heroVideoUrl, historyItems }: AboutPageProps) {
  return (
    <Layout>
      <SEO
        title="About Us | SUCCESS"
        description="Meet the SUCCESS team and learn about our history, from 1897 to today. Your trusted guide to the future of work."
        url="https://www.success.com/about-us"
      />

      <div className={styles.about}>
        {/* Hero Video Section */}
        <section className={styles.hero}>
          <div className={styles.videoWrapper}>
            <iframe
              src={heroVideoUrl}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              className={styles.video}
              title="SUCCESS About Us Video"
            />
          </div>
        </section>

        {/* History Timeline */}
        <AboutHistory historyItems={historyItems} />

        {/* Meet the Team Section */}
        <section className={styles.teamSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.verticalText}>meet the team</span>
            </h2>

            <div className={styles.teamGrid}>
              {teamMembers.map((member) => (
                <TeamMember
                  key={member.name}
                  name={member.name}
                  title={member.title}
                  bio={member.bio}
                  image={member.image}
                  linkedIn={member.linkedIn}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const supabase = supabaseAdmin();

    // Fetch team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('name, title, bio, image, linkedIn')
      .eq('isActive', true)
      .order('displayOrder', { ascending: true });

    if (teamError) {
      console.error('Error fetching team members:', teamError);
    }

    // Fetch about page content (hero video and history)
    const { data: aboutContent, error: contentError } = await supabase
      .from('about_page_content')
      .select('heroVideoUrl, historyItems')
      .eq('id', 'about-us-page')
      .single();

    if (contentError) {
      console.error('Error fetching about content:', contentError);
    }

    // Default values if content not found
    const heroVideoUrl = aboutContent?.heroVideoUrl ||
      'https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1';
    const historyItems = aboutContent?.historyItems || [];

    return {
      props: {
        teamMembers: teamMembers || [],
        heroVideoUrl,
        historyItems,
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        teamMembers: [],
        heroVideoUrl: 'https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1',
        historyItems: [],
      }
    };
  }
}
