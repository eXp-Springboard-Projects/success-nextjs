/**
 * Seed store with comprehensive product catalog
 * Including courses, books, merchandise with full descriptions
 */

import { supabaseAdmin } from '../lib/supabase';

const products = [
  // ===== COURSES =====
  {
    id: 'course-success-mindset',
    name: 'The Success Mindset Masterclass',
    price: 297.00,
    sale_price: 197.00,
    description: 'Transform your thinking and unlock your full potential with proven mindset strategies from SUCCESS Magazine experts.',
    long_description: 'This comprehensive 8-week program combines decades of SUCCESS Magazine insights with modern psychology to help you develop an unshakeable success mindset. Learn from interviews with top performers, implement daily practices, and join a community of achievers.',
    features: [
      '8 weeks of video lessons',
      '40+ hours of content',
      'Live Q&A sessions',
      'Private community access',
      'Downloadable workbooks',
      'Certificate of completion'
    ],
    includes: ['Video lessons', 'Workbooks', 'Community access', 'Certificate', 'Lifetime access'],
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
    category: 'Courses',
    subcategory: 'Personal Development',
    link: '/store/course-success-mindset',
    featured: true,
    product_type: 'course',
    digital: true,
    duration: '8 weeks',
    skill_level: 'All Levels',
    instructor: 'SUCCESS Magazine Experts',
    certification: true,
    badge: 'Bestseller',
    rating: 4.8,
    review_count: 2847,
    is_active: true,
    display_order: 1
  },
  {
    id: 'course-business-growth',
    name: 'Business Growth Accelerator',
    price: 497.00,
    sale_price: 347.00,
    description: 'Scale your business with proven strategies from entrepreneurs who built 7 and 8-figure companies.',
    long_description: 'Learn the exact systems and frameworks used by successful entrepreneurs to grow their businesses. This course covers marketing, sales, operations, and leadership with actionable strategies you can implement immediately.',
    features: [
      '12 comprehensive modules',
      'Real business case studies',
      'Growth planning templates',
      'Monthly coaching calls',
      'Private mastermind group',
      'Resource library'
    ],
    includes: ['Video training', 'Templates', 'Coaching calls', 'Mastermind access', 'Updates'],
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
    category: 'Courses',
    subcategory: 'Business',
    link: '/store/course-business-growth',
    featured: true,
    product_type: 'course',
    digital: true,
    duration: '12 weeks',
    skill_level: 'Intermediate',
    instructor: 'Multiple Experts',
    certification: true,
    badge: 'Featured',
    rating: 4.9,
    review_count: 1523,
    is_active: true,
    display_order: 2
  },
  {
    id: 'course-leadership-essentials',
    name: 'Leadership Essentials',
    price: 197.00,
    description: 'Master the fundamentals of effective leadership and inspire your team to achieve extraordinary results.',
    long_description: 'Developed in partnership with top leadership coaches, this course teaches you how to lead with confidence, communicate effectively, and build high-performing teams.',
    features: [
      '6-week program',
      '25+ video lessons',
      'Leadership assessments',
      'Action planning tools',
      'Peer discussion forums'
    ],
    includes: ['Video content', 'Assessments', 'Planning tools', 'Forum access'],
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
    category: 'Courses',
    subcategory: 'Leadership',
    link: '/store/course-leadership-essentials',
    product_type: 'course',
    digital: true,
    duration: '6 weeks',
    skill_level: 'Beginner',
    instructor: 'Dr. Sarah Mitchell',
    certification: false,
    rating: 4.7,
    review_count: 892,
    is_active: true,
    display_order: 3
  },
  {
    id: 'course-productivity-mastery',
    name: 'Productivity Mastery',
    price: 147.00,
    description: 'Double your output without working longer hours using time-tested productivity systems.',
    long_description: 'Stop feeling overwhelmed and start getting more done. This course teaches you proven productivity frameworks, time management techniques, and focus strategies used by top performers.',
    features: [
      'Self-paced learning',
      '20 hours of content',
      'Productivity planners',
      'Focus techniques',
      'Habit-building framework'
    ],
    includes: ['Video lessons', 'Planners', 'Templates', 'Mobile app access'],
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
    category: 'Courses',
    subcategory: 'Productivity',
    link: '/courses/productivity-mastery',
    product_type: 'course',
    digital: true,
    duration: 'Self-paced',
    skill_level: 'All Levels',
    instructor: 'Michael Chen',
    certification: false,
    badge: 'New',
    rating: 4.6,
    review_count: 654,
    is_active: true,
    display_order: 4
  },
  {
    id: 'course-public-speaking',
    name: 'Confident Public Speaking',
    price: 197.00,
    description: 'Overcome stage fright and deliver presentations that inspire, persuade, and captivate any audience.',
    long_description: 'Whether you are speaking to 5 people or 5,000, this course will help you communicate with confidence and impact. Learn speech structure, delivery techniques, and how to handle Q&A like a pro.',
    features: [
      '30+ video lessons',
      'Speech templates',
      'Vocal training exercises',
      'Live feedback sessions',
      'Presentation slides library'
    ],
    includes: ['Video training', 'Templates', 'Exercises', 'Feedback sessions'],
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/03/success-logo.png',
    category: 'Courses',
    subcategory: 'Communication',
    link: '/store/course-public-speaking',
    product_type: 'course',
    digital: true,
    duration: '4 weeks',
    skill_level: 'All Levels',
    instructor: 'Jessica Torres',
    certification: false,
    rating: 4.8,
    review_count: 1241,
    is_active: true,
    display_order: 5
  },

  // ===== EXPANDED MERCHANDISE =====
  {
    id: 'merch-goal-planner-2026',
    name: 'SUCCESS 2026 Goal Planner',
    price: 34.99,
    description: 'Plan your best year yet with this premium 12-month planner designed for high achievers.',
    long_description: 'The SUCCESS 2026 Goal Planner combines goal-setting frameworks from top productivity experts with beautiful design. Includes monthly reviews, weekly planning, daily priorities, and habit trackers.',
    features: [
      '12-month undated planner',
      'Premium vegan leather cover',
      'Goal-setting worksheets',
      'Monthly and weekly views',
      'Habit tracker',
      'Reflection prompts'
    ],
    author: 'SUCCESS Magazine',
    format: 'Hardcover',
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/z/364/JRohn_One_Year_Success_Planner_strapped__74510.png',
    category: 'Merchandise',
    subcategory: 'Journals & Planners',
    link: '/store/merch-goal-planner-2026',
    featured: true,
    product_type: 'physical',
    digital: false,
    badge: 'New',
    rating: 4.9,
    review_count: 2134,
    inventory_count: 500,
    is_active: true,
    display_order: 10
  },
  {
    id: 'merch-tshirt-est-1897',
    name: 'SUCCESS EST. 1897 Premium T-Shirt',
    price: 29.99,
    description: 'Wear your ambition with this premium cotton tee featuring the iconic SUCCESS logo.',
    long_description: 'Made from 100% organic cotton, this comfortable and stylish t-shirt celebrates the legacy of SUCCESS Magazine. Available in multiple colors and sizes.',
    features: [
      '100% organic cotton',
      'Unisex fit',
      'Pre-shrunk',
      'Screen-printed logo',
      'Available in 5 colors',
      'Sizes XS-3XL'
    ],
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/e/954/classic-dad-hat-stone-right-front-61b11d77c8aff__69810.jpg',
    category: 'Merchandise',
    subcategory: 'Apparel',
    link: '/store/merch-tshirt-est-1897',
    product_type: 'physical',
    digital: false,
    rating: 4.7,
    review_count: 456,
    inventory_count: 1200,
    is_active: true,
    display_order: 11
  },
  {
    id: 'merch-water-bottle',
    name: 'SUCCESS Insulated Water Bottle',
    price: 34.99,
    description: 'Stay hydrated and motivated with this premium 32oz insulated bottle.',
    long_description: 'Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours. Features motivational quotes and the SUCCESS logo.',
    features: [
      '32oz capacity',
      'Double-wall insulated',
      'BPA-free stainless steel',
      'Leak-proof lid',
      'Fits cup holders',
      'Motivational quotes'
    ],
    image: 'https://mysuccessplus.com/wp-content/uploads/nc/s-3rvn7wzn3w/product_images/o/026/white-glossy-mug-15oz-handle-on-left-6192b05a894a2__67579.jpg',
    category: 'Merchandise',
    subcategory: 'Drinkware',
    link: '/store/merch-water-bottle',
    product_type: 'physical',
    digital: false,
    badge: 'Bestseller',
    rating: 4.8,
    review_count: 789,
    inventory_count: 350,
    is_active: true,
    display_order: 12
  },
  {
    id: 'merch-notebook-set',
    name: 'SUCCESS Leather Notebook Set (3-Pack)',
    price: 44.99,
    sale_price: 34.99,
    description: 'Premium leather notebooks for capturing your biggest ideas and goals.',
    long_description: 'Set of three A5-sized notebooks with genuine leather covers, premium paper, and ribbon bookmarks. Perfect for journaling, planning, and note-taking.',
    features: [
      '3 notebooks included',
      'Genuine leather covers',
      '192 pages each',
      'Thick 120gsm paper',
      'Ribbon bookmarks',
      'Inner pockets'
    ],
    image: 'https://mysuccessplus.com/wp-content/uploads/2024/07/S23_Journal_SUCCESS-STARTS-HERE__48992-1.png',
    category: 'Merchandise',
    subcategory: 'Journals & Planners',
    link: '/store/merch-notebook-set',
    product_type: 'physical',
    digital: false,
    rating: 4.9,
    review_count: 1567,
    inventory_count: 200,
    is_active: true,
    display_order: 13
  }
];

async function seedStoreProducts() {
  const supabase = supabaseAdmin();

  console.log('🌱 Seeding store products...');

  for (const product of products) {
    try {
      const { error } = await supabase
        .from('store_products')
        .upsert(product, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error seeding ${product.name}:`, error.message);
      } else {
        console.log(`✅ Seeded: ${product.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to seed ${product.name}:`, err);
    }
  }

  console.log('✨ Store seeding complete!');
}

// Run if called directly
if (require.main === module) {
  seedStoreProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { seedStoreProducts };
