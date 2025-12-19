// About Us Page - matches SUCCESS.com/about-us exactly
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import AboutHistory from '../components/AboutHistory';
import TeamMember from '../components/TeamMember';
import styles from './About.module.css';

const teamMembers = [
  {
    name: 'Glenn Sanford',
    title: 'Managing Director and Publisher',
    bio: 'Glenn Sanford is reimagining SUCCESS® as a next-gen platform for personal growth, leadership, and high performance. By fusing its legacy with modern innovation, he\'s turning SUCCESS® into a catalyst for transformation—where timeless principles meet the tools of the AI era.',
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
    title: 'Founding Faculty & Program Lead, SUCCESS Coaching™',
    bio: 'A global strategist and transformational coach, Courtland Warren blends behavioral science with human potential. As the founding faculty of SUCCESS Coaching™, he guides leaders through identity-first transformation—helping them think deeper, lead stronger, and live with purpose.',
    image: 'https://www.success.com/wp-content/uploads/2025/10/courtland-crop.png',
    linkedIn: 'https://www.linkedin.com/in/courtlandwarren/',
  },
  {
    name: 'Rachel Nead',
    title: 'Vice President of Innovations',
    bio: 'Rachel is a mentor, coach, and AI builder helping unlock growth using the tools of tomorrow. With a decade in real estate, social media marketing, and public speaking, she brings tech, heart, and systems together to help people scale with ease.',
    image: 'https://www.success.com/wp-content/uploads/2025/11/Rachel2.png',
    linkedIn: '',
  },
  {
    name: 'Lauren Kerrigan',
    title: 'Creative Director',
    bio: 'Lauren is the wrangler and creator of branding and graphic assets for all business divisions across SUCCESS® Enterprises. She is driven to make SUCCESS beautiful!',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_lauren-kerrigan-2023.jpg',
    linkedIn: '',
  },
  {
    name: 'Tyler Clayton',
    title: 'Platform Steward — Digital Content Ecosystem',
    bio: 'Tyler has over 10 years of marketing and content experience, spanning roles from strategist and producer to writer and creative lead. As Platform Steward at SUCCESS®, he drives the digital content ecosystem—scaling personal growth through AI innovation and collective impact.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Tyler-Clayton.jpg',
    linkedIn: 'https://www.linkedin.com/in/tyler-clayton-09848a8/',
  },
  {
    name: 'Crysten Cornish',
    title: 'Social Media Community Coordinator',
    bio: 'With over eight years of experience, Crysten is a brand strategist and marketing expert who has led nationwide workshops to help businesses refine their messaging. As the social media community coordinator for SUCCESS®, she leverages her expertise in brand consulting to craft high-impact content and drive audience engagement.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Cryster-Cornish.jpg',
    linkedIn: 'https://www.linkedin.com/in/crystencornish/',
  },
  {
    name: 'Shawana Crayton',
    title: 'Business Admin & Customer Support Specialist',
    bio: 'Shawana has been with Success Enterprises for three years. With over 20 years of customer service experience, she finds joy in assisting others.',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_shawana-crayton.jpg',
    linkedIn: '',
  },
  {
    name: 'Brianna Diaz',
    title: 'Social Media Assistant',
    bio: 'Brianna is a creative professional with experience in production assistance, script reading, video editing, and social media management. She brings strong organizational and creative skills to support projects across preproduction, production, and postproduction.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Brianna-Diaz.jpg',
    linkedIn: '',
  },
  {
    name: 'Kathryn Giuffrida',
    title: 'Marketing Content & SEO Manager',
    bio: 'With over 10 years of experience in SEO and marketing strategy, Kathryn leads digital growth across all channels at SUCCESS®. She oversees initiatives that enhance brand visibility, strengthen engagement, and drive sustainable results. Passionate about personal and professional development, she enjoys connecting with purpose-driven people who are committed to growth and turning their dreams into reality.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Kathryn-Giuffrida.jpg',
    linkedIn: '',
  },
  {
    name: 'Emily Holombek',
    title: 'E-Learning & Enrichment Content Specialist',
    bio: 'Emily has a diverse background in startups, teaching, coaching, and curriculum development, with a strong focus on course design and implementation. Passionate about innovation, she thrives on creating engaging learning experiences and enhancing educational content that drives success and makes a meaningful impact.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Emily-Holombek.jpg',
    linkedIn: '',
  },
  {
    name: 'Elly Kang',
    title: 'Marketing Operations Assistant',
    bio: 'Driven by a passion for visual communication, Elly, who grew up in Korea, studied studio art at the University of Texas at Austin. With a strong interest in design and storytelling, she joined SUCCESS® as a marketing operations assistant, where she contributes to creative projects and brand engagement.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Elly-Kang.jpg',
    linkedIn: '',
  },
  {
    name: 'Maya Korogodsky',
    title: 'Senior Marketing Manager',
    bio: 'Maya, a driven professional with a BBA in Marketing from the University of Michigan, has gained experience at SoulCycle, HBO, and Meta. Thriving in diverse global environments, Maya excels in collaboration and growth, possessing proficiency in English, Russian, and Hebrew. She is eager to contribute her skills and passion for driving results to dynamic teams.',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_maya-korogodsky.jpg',
    linkedIn: '',
  },
  {
    name: 'Virginia Le',
    title: 'Senior Production Manager',
    bio: 'Virginia is a detail-oriented individual responsible for overseeing numerous aspects, both significant and minor, in her role. Joining SUCCESS magazine\'s print production team in 2018, she ensures the Editorial Team stays on track, coordinates with printers, bulk customers, advertisers, vendors, and consultants to ensure timely magazine production.',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_virginia-le-2023.jpg',
    linkedIn: '',
  },
  {
    name: 'Ava Leach',
    title: 'Social Media Manager',
    bio: 'Ava is a seasoned social media manager with over six years of industry experience. She specializes in driving engagement and brand visibility across diverse platforms, leveraging her expertise to create impactful digital strategies.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Ava-Leach.jpg',
    linkedIn: '',
  },
  {
    name: 'Denise Long',
    title: 'QC and Fact Checker',
    bio: 'With over 20 years of professional experience in copy editing, writing, and fact-checking, Denise has worked with a variety of industries from news media and tech startups to academic institutions and nonprofits. At SUCCESS®, she is a vigilant extra set of eyes for style and accuracy.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Denise-Long.jpg',
    linkedIn: '',
  },
  {
    name: 'Jamie Lyons',
    title: 'Executive & Team Assistant',
    bio: 'Jamie has a wealth of experience in executive support, operations, and project management with a strong background in startup environments, where she\'s worn many hats beyond the traditional executive assistant role.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Jamie-Lyons.jpg',
    linkedIn: '',
  },
  {
    name: 'Rena Machani',
    title: 'Editorial Assistant',
    bio: 'Rena grew up in Colorado, graduated from The University of Colorado Boulder in English, and pursed media and journalism. She recently joined SUCCESS magazine as their editorial assistant.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Rena-Machani.jpg',
    linkedIn: '',
  },
  {
    name: 'Hugh Murphy',
    title: 'Product Development & Marketing Manager',
    bio: 'Hugh is a marketing professional with extensive career experience in the publishing and advertising industries.',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_hugh-murphy-2023.jpg',
    linkedIn: '',
  },
  {
    name: 'Emily O\'Brien',
    title: 'Print Managing Editor',
    bio: 'Emily is the associate editor of SUCCESS magazine. She has contributed to more than 30 print and digital publications, focusing on architecture, wellness, travel, and lifestyle topics. She resides in Raleigh, North Carolina.',
    image: 'https://www.success.com/wp-content/uploads/2024/03/staff_emily-obrien.jpg',
    linkedIn: '',
  },
  {
    name: 'Emily Tvelia',
    title: 'Marketing Operations Specialist',
    bio: 'Emily has diverse marketing and project management knowledge with experience using various platforms to build brands, improve engagement, and optimize marketing technology. She\'s passionate about learning something new every day and eager to help solve problems that increase marketing efficiency.',
    image: 'https://www.success.com/wp-content/uploads/2025/03/Emily-Tvelia.jpg',
    linkedIn: '',
  },
  {
    name: 'Pablo Urdiales Antelo',
    title: 'News Writer',
    bio: 'As news writer at SUCCESS®, Pablo explores how AI, emerging technologies, and today\'s strategic choices are shaping the way we live, work, and build the future. He translates complex innovations into clear insights that help leaders and professionals anticipate tomorrow\'s opportunities.',
    image: 'https://www.success.com/wp-content/uploads/2025/09/Pablo-Urdiales-Antelo.jpeg',
    linkedIn: '',
  },
];

export default function AboutPage() {
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
