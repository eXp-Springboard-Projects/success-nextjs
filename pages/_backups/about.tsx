// About Us Page - Video Hero, Timeline, Team Members
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import AboutHistory from '../components/AboutHistory';
import TeamMember from '../components/TeamMember';
import styles from './About.module.css';

const teamMembers = [
  {
    name: 'Glenn Sanford',
    title: 'Managing Director and Publisher',
    bio: 'Glenn Sanford is reimagining SUCCESS as a next-gen platform for personal growth, leadership, and high performance. By fusing its legacy with modern innovation, he is turning SUCCESS into a catalyst for transformation where timeless principles meet the tools of the AI era.',
    image: 'https://www.success.com/wp-content/uploads/2025/10/GlennSquare.png',
    linkedIn: 'https://www.linkedin.com/in/glenndsanford/',
  },
  {
    name: 'Kerrie Lee Brown',
    title: 'Chief Content Officer & Editor-in-Chief',
    bio: 'Kerrie Lee Brown is an award-winning journalist, speaker, and wellness advocate with 30 years of experience in media and communications. She has contributed works to over 150 magazines globally and interviewed top names in Hollywood and business. Kerrie is passionate about mentoring others, promoting authentic leadership, and inspiring creative teams.',
    image: 'https://www.success.com/wp-content/uploads/2025/10/kerrielee2_square_no_blackbar.jpg',
    linkedIn: 'https://www.linkedin.com/in/kerrieleebrown/',
  },
  {
    name: 'Courtland Warren',
    title: 'Founding Faculty & Program Lead, SUCCESS Coaching',
    bio: 'A global strategist and transformational coach, Courtland Warren blends behavioral science with human potential. As the founding faculty of SUCCESS Coaching, he guides leaders through identity-first transformation helping them think deeper, lead stronger, and live with purpose.',
    image: 'https://www.success.com/wp-content/uploads/2025/10/courtland-crop.png',
    linkedIn: 'https://www.linkedin.com/in/courtlandwarren/',
  },
  {
    name: 'Rachel Nead',
    title: 'Vice President of Innovations',
    bio: 'Rachel Nead brings a fresh perspective to innovation, leveraging emerging technologies and creative strategies to advance SUCCESS mission. Her leadership drives the development of cutting-edge platforms and solutions that empower individuals to achieve their full potential.',
    image: 'https://www.success.com/wp-content/uploads/2025/11/Rachel2.png',
    linkedIn: '',
  },
];

export default function AboutPage() {
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
  return {
    props: {}
  };
}
