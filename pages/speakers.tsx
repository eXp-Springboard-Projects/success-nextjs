import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './Speakers.module.css';

type Speaker = {
  id: string;
  name: string;
  image: string;
  bio?: string;
  link?: string;
};

type SpeakersPageProps = {
  speakers: Speaker[];
};

export default function SpeakersPage({ speakers }: SpeakersPageProps) {
  return (
    <Layout>
      <SEO
        title="SUCCESS® Speakers Bureau - Book World-Class Speakers"
        description="Get exclusive access to world-class speakers through the SUCCESS Speakers Bureau. Book top speakers for your next event."
        url="https://www.success.com/speakers"
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Speakers For Every Event</h1>
          <p className={styles.subtitle}>
            Get exclusive access to world-class speakers<br />
            through the SUCCESS Speakers Bureau.
          </p>
        </header>

        <div className={styles.speakersGrid}>
          {speakers.map((speaker) => (
            <div key={speaker.id} className={styles.speakerCard}>
              <div className={styles.speakerImage}>
                <img src={speaker.image} alt={speaker.name} loading="lazy" />
              </div>
              <h3 className={styles.speakerName}>{speaker.name}</h3>
              {speaker.bio && <p className={styles.speakerBio}>{speaker.bio}</p>}
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <h2>Ready to Book a Speaker?</h2>
          <p>Contact us to bring world-class speakers to your next event</p>
          <a href="/contact" className={styles.ctaButton}>
            Contact Us
          </a>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const speakers: Speaker[] = [
    {
      id: '1',
      name: 'Grant Cardone',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1.jpg',
    },
    {
      id: '2',
      name: 'Daymond John',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1s.jpg',
    },
    {
      id: '3',
      name: 'Jenn Lim',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1d.jpg',
    },
    {
      id: '4',
      name: 'Andrea Navedo',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1a.jpg',
    },
    {
      id: '5',
      name: 'Mel Robbins',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1e.jpg',
    },
    {
      id: '6',
      name: 'Nick Santonastasso',
      image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/90a1045e58f8b8b4c70dafa7986ed4f1w.jpg',
    },
  ];

  return {
    props: {
      speakers,
    },
  };
};
