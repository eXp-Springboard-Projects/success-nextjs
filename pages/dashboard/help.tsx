import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from './dashboard.module.css';
import helpStyles from './help.module.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/signin?redirect=/dashboard/help');
    return null;
  }

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'Getting Started',
      question: 'How do I access my SUCCESS+ courses?',
      answer: 'Navigate to the Courses page from your dashboard sidebar. All available courses will be displayed there. Click on any course to view details and start learning.',
    },
    {
      id: '2',
      category: 'Getting Started',
      question: 'What is included in my SUCCESS+ Insider membership?',
      answer: 'Your Insider membership includes unlimited access to all courses, exclusive articles, monthly digital magazine issues, podcast episodes, video training library, community access, live events, and downloadable resources.',
    },
    {
      id: '3',
      category: 'Account',
      question: 'How do I update my profile information?',
      answer: 'Go to Settings from your dashboard sidebar. You can update your name, bio, job title, website, and social media links in the Profile tab.',
    },
    {
      id: '4',
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Navigate to Settings > Password tab. Enter your current password, then your new password twice to confirm the change.',
    },
    {
      id: '5',
      category: 'Billing',
      question: 'How do I cancel my subscription?',
      answer: 'Go to Billing & Orders from your dashboard. Click on "Manage Subscription" to access your billing portal where you can cancel or modify your subscription.',
    },
    {
      id: '6',
      category: 'Billing',
      question: 'When will I be charged for my subscription?',
      answer: 'You will be charged at the beginning of each billing cycle (monthly or annually, depending on your plan). You can view your next billing date in the Billing & Orders section.',
    },
    {
      id: '7',
      category: 'Content',
      question: 'Can I download course materials?',
      answer: 'Yes! Most courses include downloadable resources such as worksheets, templates, and guides. Look for the download icon within each course module.',
    },
    {
      id: '8',
      category: 'Content',
      question: 'How often is new content added?',
      answer: 'We add new content regularly including weekly articles, monthly magazine issues, and new courses quarterly. Premium members get early access to all new content.',
    },
    {
      id: '9',
      category: 'Technical',
      question: 'What browsers are supported?',
      answer: 'SUCCESS+ works best on the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, please keep your browser updated.',
    },
    {
      id: '10',
      category: 'Technical',
      question: 'Can I access SUCCESS+ on mobile devices?',
      answer: 'Yes! SUCCESS+ is fully responsive and works on all mobile devices. For the best mobile experience, visit mysuccessplus.com on your mobile browser.',
    },
  ];

  const categories = ['all', ...new Set(faqs.map(f => f.category))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Head>
        <title>Help Center - SUCCESS+</title>
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
              <button><span className={styles.icon}>🎯</span> My DISC Profile</button>
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
              <button className={styles.active}><span className={styles.icon}>❓</span> Help Center</button>
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
            <h1>Help Center</h1>
            <p className={styles.subtitle}>Get answers to your questions</p>
          </div>

          <div className={helpStyles.searchSection}>
            <div className={helpStyles.searchBox}>
              <span className={helpStyles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={helpStyles.searchInput}
              />
            </div>
          </div>

          <div className={helpStyles.quickLinks}>
            <h2>Quick Help</h2>
            <div className={helpStyles.quickLinksGrid}>
              <button
                className={helpStyles.quickLinkCard}
                onClick={() => window.open('https://mysuccessplus.com/support/contact', '_blank')}
              >
                <span className={helpStyles.quickLinkIcon}>💬</span>
                <h3>Contact Support</h3>
                <p>Get help from our team</p>
              </button>
              <button
                className={helpStyles.quickLinkCard}
                onClick={() => window.open('https://mysuccessplus.com/support/video-tutorials', '_blank')}
              >
                <span className={helpStyles.quickLinkIcon}>🎥</span>
                <h3>Video Tutorials</h3>
                <p>Watch step-by-step guides</p>
              </button>
              <Link href="/dashboard/community" className={helpStyles.quickLinkCard}>
                <span className={helpStyles.quickLinkIcon}>👥</span>
                <h3>Community Forum</h3>
                <p>Ask the community</p>
              </Link>
              <button
                className={helpStyles.quickLinkCard}
                onClick={() => window.open('https://mysuccessplus.com/support/live-chat', '_blank')}
              >
                <span className={helpStyles.quickLinkIcon}>💭</span>
                <h3>Live Chat</h3>
                <p>Chat with support now</p>
              </button>
            </div>
          </div>

          <div className={helpStyles.faqSection}>
            <h2>Frequently Asked Questions</h2>

            <div className={helpStyles.categoryFilter}>
              {categories.map(category => (
                <button
                  key={category}
                  className={selectedCategory === category ? helpStyles.activeCategory : ''}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Topics' : category}
                </button>
              ))}
            </div>

            <div className={helpStyles.faqList}>
              {filteredFaqs.map(faq => (
                <div key={faq.id} className={helpStyles.faqItem}>
                  <button
                    className={helpStyles.faqQuestion}
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <span className={helpStyles.faqToggle}>
                      {expandedFaq === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className={helpStyles.faqAnswer}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className={helpStyles.emptyState}>
                <div className={helpStyles.emptyIcon}>🔍</div>
                <h3>No results found</h3>
                <p>Try different search terms or browse all topics</p>
              </div>
            )}
          </div>

          <div className={helpStyles.contactSection}>
            <h2>Still Need Help?</h2>
            <p>Can't find what you're looking for? Our support team is here to help!</p>
            <div className={helpStyles.contactButtons}>
              <button
                className={helpStyles.primaryBtn}
                onClick={() => window.open('https://mysuccessplus.com/support/contact', '_blank')}
              >
                Contact Support
              </button>
              <button
                className={helpStyles.secondaryBtn}
                onClick={() => window.open('mailto:support@success.com')}
              >
                Email Us
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
