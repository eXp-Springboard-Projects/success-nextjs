import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import styles from './DailySMS.module.css';

export default function DailySMSPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const scrollToForm = () => {
    const formSection = document.getElementById('signup-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/daily-sms/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setFormData({ firstName: '', lastName: '', phone: '', email: '' });
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: '🎯',
      title: 'Clarified Focus',
      description: 'Start your day with intention and direction',
    },
    {
      icon: '🌱',
      title: 'Growth Mindset',
      description: 'Cultivate continuous learning and improvement',
    },
    {
      icon: '💡',
      title: 'Self-Awareness',
      description: 'Deepen understanding of yourself and your goals',
    },
    {
      icon: '💪',
      title: 'Resilience',
      description: 'Build mental strength to overcome challenges',
    },
    {
      icon: '✨',
      title: 'Increased Creativity',
      description: 'Unlock new perspectives and innovative thinking',
    },
    {
      icon: '🧘',
      title: 'Emotional Well-being',
      description: 'Enhance your mood and mental health',
    },
  ];

  return (
    <Layout>
      <SEO
        title="Daily Inspirational Quotes via SMS | SUCCESS"
        description="Get daily motivational quotes texted to you. Free inspiration focused on personal development, professional growth, wealth, relationships, and well-being."
        url="https://www.success.com/daily-sms"
      />

      <div className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Get Daily Inspirational Quotes
                <span className={styles.highlight}> Texted to You</span>
              </h1>
              <p className={styles.heroSubtitle}>
                One quote that touches your heart or reminds you of your dreams can inspire steps that change everything.
              </p>
              <div className={styles.heroFeatures}>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Daily motivation delivered to your phone</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Curated quotes on success, growth & well-being</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>100% free, unsubscribe anytime</span>
                </div>
              </div>
              <button onClick={scrollToForm} className={styles.heroCtaButton}>
                Sign Up Now
              </button>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.phoneFrame}>
                <img
                  src="/images/sms-phone-mockup.svg"
                  alt="Daily quotes on mobile phone"
                  className={styles.phoneMockup}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className={styles.benefitsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Why Daily Inspirational Quotes?
            </h2>
            <p className={styles.sectionSubtitle}>
              Psychological research shows that regular exposure to positive, motivational content can transform your mindset and daily actions.
            </p>

            <div className={styles.benefitsGrid}>
              {benefits.map((benefit, index) => (
                <div key={index} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>{benefit.icon}</div>
                  <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                  <p className={styles.benefitDescription}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signup Form Section */}
        <section id="signup-form" className={styles.signupSection}>
          <div className={styles.container}>
            <div className={styles.formWrapper}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Start Your Daily Dose of Inspiration</h2>
                <p className={styles.formSubtitle}>
                  Join thousands receiving daily motivation via text message
                </p>
              </div>

              {submitted ? (
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>🎉</div>
                  <h3>You're All Set!</h3>
                  <p>
                    Thank you for subscribing! You'll start receiving daily inspirational quotes via text message.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className={styles.secondaryButton}
                  >
                    Subscribe Another Number
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        disabled={loading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        disabled={loading}
                      />
                      <small className={styles.helpText}>
                        Standard message rates may apply
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Subscribing...' : 'Sign Up Now'}
                  </button>

                  <p className={styles.disclaimer}>
                    By signing up, you agree to receive daily text messages from SUCCESS.
                    You can unsubscribe at any time by replying STOP.
                    Message and data rates may apply.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section className={styles.topicsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              What You'll Receive
            </h2>
            <p className={styles.sectionSubtitle}>
              Carefully curated quotes covering the topics that matter most
            </p>

            <div className={styles.topicsGrid}>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>💼</div>
                <h3>Professional Growth</h3>
                <p>Career advancement and workplace success</p>
              </div>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>🎯</div>
                <h3>Personal Development</h3>
                <p>Self-improvement and goal achievement</p>
              </div>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>💰</div>
                <h3>Wealth & Abundance</h3>
                <p>Financial wisdom and prosperity mindset</p>
              </div>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>❤️</div>
                <h3>Relationships</h3>
                <p>Connection, love, and meaningful bonds</p>
              </div>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>🌟</div>
                <h3>Well-being</h3>
                <p>Health, happiness, and balance</p>
              </div>
              <div className={styles.topicCard}>
                <div className={styles.topicIcon}>🚀</div>
                <h3>Motivation</h3>
                <p>Energy, drive, and taking action</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
