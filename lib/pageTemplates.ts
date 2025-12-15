// Pre-built page templates for easy content creation

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  content: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export const pageTemplates: PageTemplate[] = [
  {
    id: 'magazine-article',
    name: 'Magazine Article',
    description: 'Full-featured article layout with hero image, pull quotes, and author bio',
    thumbnail: '📰',
    content: `
      <div class="full-width-image">
        <img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200" alt="Featured article image" />
        <p class="caption">Add your hero image caption here</p>
      </div>

      <h2>Your Article Headline Goes Here</h2>

      <p class="lead">This is your lead paragraph. Make it compelling and summarize the key takeaway of your article. This should hook the reader and make them want to read more.</p>

      <p>Start your main content here. This is where you'll share your story, insights, or information. Break up your content into short paragraphs of 2-3 sentences for better readability.</p>

      <p>Continue building your narrative. Use clear, concise language that speaks directly to your audience.</p>

      <div class="pull-quote">
        <p>"Add a powerful quote here that reinforces your main message. Pull quotes break up text and highlight key insights."</p>
      </div>

      <h3>Section Heading</h3>

      <p>Break your article into logical sections with H3 headings. This helps readers scan and find the information they need.</p>

      <ul>
        <li>Use bullet points to list key takeaways</li>
        <li>Make each point clear and actionable</li>
        <li>Keep lists between 3-7 items for best readability</li>
      </ul>

      <h3>Another Section Heading</h3>

      <p>Add more content here. Consider including statistics, case studies, or expert insights to support your points.</p>

      <div class="callout-box" data-variant="info">
        <p><strong>Pro Tip:</strong> Use callout boxes to highlight important information, tips, or warnings that readers shouldn't miss.</p>
      </div>

      <h3>Key Takeaways</h3>

      <ol>
        <li>Summarize your first main point</li>
        <li>Recap your second key insight</li>
        <li>Remind readers of your final takeaway</li>
      </ol>

      <div class="author-bio">
        <h4>About the Author</h4>
        <p><strong>Author Name</strong> is a [title/role] at SUCCESS Magazine. Replace this with your actual bio highlighting your expertise and credentials.</p>
      </div>
    `,
    seoTitle: 'Your Article Title | SUCCESS Magazine',
    seoDescription: 'Replace this with a compelling 150-160 character summary of your article that will appear in search results.',
  },

  {
    id: 'press-release',
    name: 'Press Release',
    description: 'Professional press release format with contact information',
    thumbnail: '📢',
    content: `
      <p style="text-align: center;"><strong>FOR IMMEDIATE RELEASE</strong></p>
      <p style="text-align: center;">[Date]</p>

      <h1 style="text-align: center;">Your Compelling Press Release Headline</h1>
      <h3 style="text-align: center;"><em>Subheadline that expands on the main headline and provides additional context</em></h3>

      <p><strong>[CITY, STATE] – [DATE]</strong> – Start your press release with a strong lead paragraph that answers the who, what, when, where, and why. This paragraph should contain the most newsworthy information.</p>

      <p>The second paragraph expands on the lead, providing more details and context. Include quotes from key stakeholders or executives here.</p>

      <blockquote>
        <p>"Insert a powerful quote from your CEO, founder, or key stakeholder that adds credibility and a human element to the announcement," said [Name], [Title] at [Company].</p>
      </blockquote>

      <p>Continue with additional paragraphs that provide supporting details, statistics, or background information. Each paragraph should add value and move the story forward.</p>

      <p>Include information about the impact, benefits, or significance of your announcement. Use data and specific examples when possible.</p>

      <blockquote>
        <p>"Add a second quote if needed to provide a different perspective or additional insight," added [Name], [Title].</p>
      </blockquote>

      <h3>About [Company Name]</h3>
      <p>[Company Name] is [brief description of your company, what you do, and your mission]. Founded in [year], we [key achievements or differentiators]. For more information, visit [website].</p>

      <div class="divider" data-style="solid"></div>

      <p><strong>Media Contact:</strong><br>
      [Contact Name]<br>
      [Title]<br>
      [Company Name]<br>
      [Email Address]<br>
      [Phone Number]</p>

      <p style="text-align: center;">###</p>
    `,
    seoTitle: 'Press Release: [Your Announcement] | Company Name',
    seoDescription: 'Company Name announces [brief summary of press release]. Learn more about this important announcement.',
  },

  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'High-converting landing page with CTA buttons and testimonials',
    thumbnail: '🚀',
    content: `
      <h1 style="text-align: center;">Transform Your [Business/Life/Career] in Just 30 Days</h1>
      <p style="text-align: center;" class="lead">Clear, benefit-driven subheadline that explains exactly what you offer and why it matters</p>

      <div style="text-align: center; margin: 2rem 0;">
        <div class="button-block" data-variant="primary">
          <a href="#signup">Get Started Free →</a>
        </div>
      </div>

      <div class="full-width-image">
        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200" alt="Hero image" />
      </div>

      <h2 style="text-align: center;">Why [Your Solution] Works</h2>

      <div class="two-column-text">
        <div class="column">
          <h3>✓ Benefit #1</h3>
          <p>Explain how your solution solves a specific problem or delivers a tangible benefit.</p>
        </div>
        <div class="column">
          <h3>✓ Benefit #2</h3>
          <p>Highlight another key advantage that sets you apart from alternatives.</p>
        </div>
      </div>

      <div class="two-column-text">
        <div class="column">
          <h3>✓ Benefit #3</h3>
          <p>Share a third compelling reason why prospects should choose you.</p>
        </div>
        <div class="column">
          <h3>✓ Benefit #4</h3>
          <p>Emphasize the transformation or outcome they'll experience.</p>
        </div>
      </div>

      <div class="callout-box" data-variant="success">
        <h3 style="text-align: center;">Special Limited-Time Offer</h3>
        <p style="text-align: center;">Sign up today and get [bonus/discount]. Only available for the next [timeframe]!</p>
      </div>

      <h2 style="text-align: center;">What Our Customers Are Saying</h2>

      <div class="pull-quote">
        <p>"This product/service completely changed the way I work. I've seen [specific result] in just [timeframe]. Highly recommended!"</p>
        <p><strong>— Customer Name, Title/Company</strong></p>
      </div>

      <div class="pull-quote">
        <p>"The best investment I've made in my business. The ROI has been incredible and the support team is fantastic."</p>
        <p><strong>— Customer Name, Title/Company</strong></p>
      </div>

      <h2 style="text-align: center;">Frequently Asked Questions</h2>

      <h3>How does it work?</h3>
      <p>Provide a clear, concise answer that addresses this common question and removes barriers to conversion.</p>

      <h3>What's included?</h3>
      <p>List everything they get when they sign up. Be specific and emphasize value.</p>

      <h3>Is there a guarantee?</h3>
      <p>Explain your guarantee or risk-reversal to reduce purchase anxiety.</p>

      <div style="text-align: center; margin: 3rem 0;">
        <h2>Ready to Get Started?</h2>
        <p class="lead">Join [X] others who have already transformed their [business/life/career]</p>
        <div class="button-block" data-variant="primary">
          <a href="#signup">Start Your Free Trial →</a>
        </div>
        <p><small>No credit card required • Cancel anytime • 30-day money-back guarantee</small></p>
      </div>
    `,
    seoTitle: 'Transform Your Business | Get Started Free Today',
    seoDescription: 'Join thousands of successful professionals using our proven system. Start your free trial today - no credit card required.',
  },

  {
    id: 'event-page',
    name: 'Event Page',
    description: 'Event promotion page with date, location, and registration CTA',
    thumbnail: '🎟️',
    content: `
      <h1 style="text-align: center;">SUCCESS Summit 2025</h1>
      <p style="text-align: center;" class="lead">The premier event for entrepreneurs and business leaders</p>

      <div class="full-width-image">
        <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200" alt="Event venue" />
      </div>

      <div class="callout-box" data-variant="info">
        <h3 style="text-align: center;">Event Details</h3>
        <p style="text-align: center;">
          📅 <strong>Date:</strong> [Month Day-Day, Year]<br>
          📍 <strong>Location:</strong> [Venue Name, City, State]<br>
          ⏰ <strong>Time:</strong> [Start Time] - [End Time]<br>
          💰 <strong>Price:</strong> Early Bird $XXX (Regular $XXX)
        </p>
      </div>

      <div style="text-align: center; margin: 2rem 0;">
        <div class="button-block" data-variant="primary">
          <a href="#register">Register Now →</a>
        </div>
        <p><small>Limited spots available • Early bird pricing ends [date]</small></p>
      </div>

      <h2>What You'll Learn</h2>

      <p>This immersive [duration] experience brings together industry leaders, innovative thinkers, and ambitious entrepreneurs for an unforgettable journey of growth and connection.</p>

      <h3>🎯 Key Topics</h3>
      <ul>
        <li><strong>Topic Area 1:</strong> Description of what attendees will learn</li>
        <li><strong>Topic Area 2:</strong> Key insights and takeaways</li>
        <li><strong>Topic Area 3:</strong> Actionable strategies they can implement</li>
        <li><strong>Topic Area 4:</strong> Expert perspectives and case studies</li>
      </ul>

      <h2>Featured Speakers</h2>

      <div class="image-text-layout" data-position="left">
        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400" alt="Speaker name" />
        <div>
          <h3>Speaker Name</h3>
          <p><strong>Title, Company</strong></p>
          <p>Brief bio highlighting their expertise and why they're qualified to speak on this topic. Include notable achievements or credentials.</p>
        </div>
      </div>

      <div class="image-text-layout" data-position="right">
        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" alt="Speaker name" />
        <div>
          <h3>Speaker Name</h3>
          <p><strong>Title, Company</strong></p>
          <p>Brief bio highlighting their expertise and why they're qualified to speak on this topic. Include notable achievements or credentials.</p>
        </div>
      </div>

      <h2>Event Schedule</h2>

      <h3>Day 1 - [Month Day]</h3>
      <ul>
        <li><strong>9:00 AM - 10:00 AM:</strong> Registration & Networking Breakfast</li>
        <li><strong>10:00 AM - 11:30 AM:</strong> Opening Keynote - [Topic]</li>
        <li><strong>11:45 AM - 1:00 PM:</strong> Panel Discussion - [Topic]</li>
        <li><strong>1:00 PM - 2:00 PM:</strong> Networking Lunch</li>
        <li><strong>2:00 PM - 4:00 PM:</strong> Breakout Sessions (Choose Your Track)</li>
        <li><strong>4:15 PM - 5:30 PM:</strong> Workshop - [Topic]</li>
        <li><strong>6:00 PM - 8:00 PM:</strong> Evening Reception</li>
      </ul>

      <h2>What's Included</h2>

      <div class="two-column-text">
        <div class="column">
          <h3>✓ Full Conference Access</h3>
          <p>All keynotes, sessions, and workshops</p>

          <h3>✓ Networking Opportunities</h3>
          <p>Connect with 500+ attendees</p>

          <h3>✓ Materials & Resources</h3>
          <p>Digital workbook and presentation slides</p>
        </div>
        <div class="column">
          <h3>✓ Meals & Refreshments</h3>
          <p>Breakfast, lunch, and networking reception</p>

          <h3>✓ Certificate of Completion</h3>
          <p>Professional development credentials</p>

          <h3>✓ Exclusive Community Access</h3>
          <p>Join our private alumni network</p>
        </div>
      </div>

      <div class="pull-quote">
        <p>"This event was transformative for my business. The connections I made and insights I gained were worth 10x the ticket price!"</p>
        <p><strong>— Previous Attendee Name, Title</strong></p>
      </div>

      <div style="text-align: center; margin: 3rem 0; padding: 2rem; background: #f9fafb; border-radius: 8px;">
        <h2>Don't Miss Out</h2>
        <p class="lead">Join us for an unforgettable experience that will accelerate your success</p>
        <div class="button-block" data-variant="primary">
          <a href="#register">Secure Your Spot →</a>
        </div>
        <p><small>Only [X] spots remaining at early bird price</small></p>
      </div>

      <h3>Questions?</h3>
      <p>Contact us at <a href="mailto:events@success.com">events@success.com</a> or call (XXX) XXX-XXXX</p>
    `,
    seoTitle: 'SUCCESS Summit 2025 - Register Now | SUCCESS Events',
    seoDescription: 'Join industry leaders at SUCCESS Summit 2025. Limited early bird pricing available. Register now for this premier business event.',
  },

  {
    id: 'about-bio',
    name: 'About/Bio Page',
    description: 'Professional biography or team member profile page',
    thumbnail: '👤',
    content: `
      <div style="text-align: center;">
        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" alt="Your Name" style="border-radius: 50%; width: 200px; height: 200px; object-fit: cover; margin: 0 auto;" />
        <h1>Your Name</h1>
        <p class="lead">Your Title / Role</p>
      </div>

      <div class="divider" data-style="solid"></div>

      <h2>About Me</h2>

      <p class="lead">Start with a compelling hook that captures who you are and what you're passionate about in one or two sentences.</p>

      <p>Share your professional background and journey. How did you get to where you are today? What experiences shaped your career path? Keep this section engaging and relatable.</p>

      <p>Highlight your current role and responsibilities. What do you focus on day-to-day? What impact are you making in your field or industry?</p>

      <div class="callout-box" data-variant="info">
        <p><strong>Quick Facts:</strong></p>
        <ul>
          <li>📍 Based in [City, State/Country]</li>
          <li>🎓 [Degree] from [University]</li>
          <li>💼 [X]+ years in [industry/field]</li>
          <li>🏆 [Notable achievement or certification]</li>
        </ul>
      </div>

      <h2>My Expertise</h2>

      <div class="two-column-text">
        <div class="column">
          <h3>🎯 Area of Expertise #1</h3>
          <p>Brief description of your skills and experience in this area. What makes you uniquely qualified?</p>
        </div>
        <div class="column">
          <h3>💡 Area of Expertise #2</h3>
          <p>Highlight another key competency or specialization that sets you apart.</p>
        </div>
      </div>

      <div class="two-column-text">
        <div class="column">
          <h3>📈 Area of Expertise #3</h3>
          <p>Share a third area where you excel and can add value.</p>
        </div>
        <div class="column">
          <h3>🚀 Area of Expertise #4</h3>
          <p>Emphasize what you're most passionate about or known for.</p>
        </div>
      </div>

      <h2>My Journey</h2>

      <p>Tell your story in a more personal way. What challenges have you overcome? What pivotal moments defined your path? Share the human side of your professional journey.</p>

      <div class="pull-quote">
        <p>"Include a personal quote or philosophy that guides your work and life. This helps readers connect with your values and perspective."</p>
      </div>

      <h2>Recognition & Achievements</h2>

      <ul>
        <li><strong>[Year]:</strong> Award or recognition received</li>
        <li><strong>[Year]:</strong> Major milestone or achievement</li>
        <li><strong>[Year]:</strong> Publication, speaking engagement, or project</li>
        <li><strong>[Year]:</strong> Certification or additional credential earned</li>
      </ul>

      <h2>When I'm Not Working</h2>

      <p>Share some personal interests and hobbies that help people understand you beyond your professional role. This makes you more relatable and memorable.</p>

      <p>Consider mentioning volunteer work, causes you support, or how you give back to your community.</p>

      <div style="text-align: center; margin: 3rem 0;">
        <h2>Let's Connect</h2>
        <p>I'd love to hear from you! Whether you have questions, collaboration ideas, or just want to chat about [your area of interest].</p>
        <div class="button-block" data-variant="primary">
          <a href="mailto:your.email@example.com">Get in Touch →</a>
        </div>
        <p>
          <a href="https://linkedin.com/in/yourprofile" target="_blank">LinkedIn</a> •
          <a href="https://twitter.com/yourhandle" target="_blank">Twitter</a> •
          <a href="https://yourwebsite.com" target="_blank">Website</a>
        </p>
      </div>
    `,
    seoTitle: 'About [Your Name] | Professional Bio',
    seoDescription: 'Learn about [Your Name], [your title/role] with [X]+ years experience in [field]. Connect for speaking, consulting, or collaboration opportunities.',
  },

  {
    id: 'contact-page',
    name: 'Contact Page',
    description: 'Contact page with multiple ways to get in touch',
    thumbnail: '📧',
    content: `
      <h1 style="text-align: center;">Get in Touch</h1>
      <p style="text-align: center;" class="lead">We'd love to hear from you. Choose the best way to reach us below.</p>

      <div class="divider" data-style="solid"></div>

      <div class="two-column-text">
        <div class="column">
          <h2>Contact Information</h2>

          <h3>📧 Email</h3>
          <p>
            <strong>General Inquiries:</strong><br>
            <a href="mailto:info@success.com">info@success.com</a>
          </p>
          <p>
            <strong>Customer Support:</strong><br>
            <a href="mailto:support@success.com">support@success.com</a>
          </p>
          <p>
            <strong>Media/Press:</strong><br>
            <a href="mailto:press@success.com">press@success.com</a>
          </p>

          <h3>📞 Phone</h3>
          <p>
            <strong>Main Office:</strong> (XXX) XXX-XXXX<br>
            <strong>Customer Support:</strong> (XXX) XXX-XXXX<br>
            <small>Monday-Friday, 9am-5pm EST</small>
          </p>

          <h3>📍 Address</h3>
          <p>
            SUCCESS Magazine<br>
            [Street Address]<br>
            [City, State ZIP]<br>
            [Country]
          </p>

          <h3>💬 Social Media</h3>
          <p>
            <a href="https://twitter.com/successmagazine" target="_blank">Twitter</a><br>
            <a href="https://facebook.com/successmagazine" target="_blank">Facebook</a><br>
            <a href="https://instagram.com/successmagazine" target="_blank">Instagram</a><br>
            <a href="https://linkedin.com/company/success-magazine" target="_blank">LinkedIn</a>
          </p>
        </div>

        <div class="column">
          <h2>Send Us a Message</h2>

          <div class="callout-box" data-variant="info">
            <p><strong>Contact Form</strong></p>
            <p>For immediate assistance, please use our contact form. We typically respond within 24 hours during business days.</p>
            <div class="button-block" data-variant="primary">
              <a href="/contact-form">Open Contact Form →</a>
            </div>
          </div>

          <h3>Response Times</h3>
          <ul>
            <li><strong>Email:</strong> Within 24-48 hours</li>
            <li><strong>Phone:</strong> Immediate during business hours</li>
            <li><strong>Social Media:</strong> Within 2-4 hours</li>
          </ul>
        </div>
      </div>

      <div class="divider" data-style="solid"></div>

      <h2 style="text-align: center;">Frequently Asked Questions</h2>

      <div class="two-column-text">
        <div class="column">
          <h3>Subscription Support</h3>
          <p>For questions about your magazine or SUCCESS+ subscription, visit our <a href="/help">Help Center</a> or email <a href="mailto:subscriptions@success.com">subscriptions@success.com</a></p>

          <h3>Editorial Submissions</h3>
          <p>Interested in contributing? Review our <a href="/submission-guidelines">submission guidelines</a> and pitch your ideas to <a href="mailto:editorial@success.com">editorial@success.com</a></p>
        </div>

        <div class="column">
          <h3>Advertising & Partnerships</h3>
          <p>To discuss advertising opportunities or partnerships, contact our business development team at <a href="mailto:partnerships@success.com">partnerships@success.com</a></p>

          <h3>Technical Support</h3>
          <p>Having trouble with the website? Our tech support team is here to help at <a href="mailto:techsupport@success.com">techsupport@success.com</a></p>
        </div>
      </div>

      <div class="callout-box" data-variant="success">
        <h3 style="text-align: center;">Visit Our Office</h3>
        <p style="text-align: center;">We welcome visitors by appointment. Our team is here Monday through Friday, 9am-5pm EST.</p>
        <p style="text-align: center;">
          <div class="button-block" data-variant="secondary">
            <a href="mailto:appointments@success.com">Schedule a Visit →</a>
          </div>
        </p>
      </div>

      <div style="text-align: center; margin: 3rem 0;">
        <h2>We're Here to Help</h2>
        <p class="lead">Whatever you need, we're committed to providing exceptional support and service.</p>
      </div>
    `,
    seoTitle: 'Contact Us | SUCCESS Magazine',
    seoDescription: 'Get in touch with SUCCESS Magazine. Contact our team for customer support, media inquiries, or general questions. We\'re here to help!',
  },
];

export function getTemplateById(id: string): PageTemplate | undefined {
  return pageTemplates.find(template => template.id === id);
}

export function getTemplateNames(): Array<{ id: string; name: string }> {
  return pageTemplates.map(t => ({ id: t.id, name: t.name }));
}
