// TEMPORARY: One-time import endpoint - DELETE AFTER USE
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const teamMembers = [
  {
    name: 'Glenn Sanford',
    title: 'Managing Director & Publisher',
    bio: 'Glenn Sanford is reimagining SUCCESS as a next-gen platform for personal growth, leadership, and high performance. By fusing its legacy with modern innovation, he is turning SUCCESS into a catalyst for transformation-where timeless principles meet the tools of the AI era.',
    linkedIn: 'https://www.linkedin.com/in/glenndsanford/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Glenn-Sanford_Headshot_Square.jpg',
    displayOrder: 1,
  },
  {
    name: 'Kerrie Lee Brown',
    title: 'Chief Content Officer & Editor-in-Chief',
    bio: 'Kerrie Lee Brown is an award-winning journalist, speaker, and author with 30 years of experience in media, publishing and communications. She has contributed to over 150 magazines worldwide and interviewed some of the most talked about names in thought leadership, pop culture and business. Kerrie is passionate about mentoring entrepreneurs, instilling authentic leadership, and managing innovative creative teams.',
    linkedIn: 'https://www.linkedin.com/in/kerrieleebrown/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/04/KLB-headshot-square.jpg',
    displayOrder: 2,
  },
  {
    name: 'Courtland Warren',
    title: 'Founding Faculty & Program Lead, SUCCESS Coaching',
    bio: 'A global strategist and transformational coach, Courtland Warren blends behavioral science with human potential. As the founding faculty of SUCCESS Coaching, he guides leaders through identity-first transformation-helping them think deeper, lead stronger, and live with purpose.',
    linkedIn: 'https://www.linkedin.com/in/courtlandwarren/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Courtland-Warren_Headshot_Square.jpg',
    displayOrder: 3,
  },
  {
    name: 'Rachel Nead',
    title: 'Vice President of Innovations',
    bio: 'Rachel is a mentor, coach, and AI builder helping unlock growth using the tools of tomorrow. With a decade in real estate, social media marketing, and public speaking, she brings tech, heart, and systems together to help people scale with ease.',
    linkedIn: 'https://www.linkedin.com/in/rachel-nead-662a91117',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Rachel-Nead_Headshot_Square.jpg',
    displayOrder: 4,
  },
  {
    name: 'Lauren Kerrigan',
    title: 'Creative Director',
    bio: 'Lauren is the wrangler and creator of branding and graphic assets for all business divisions across SUCCESS Enterprises. She is driven to make SUCCESS beautiful!',
    linkedIn: 'https://www.linkedin.com/in/lauren-crispin-kerrigan-6043986/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Lauren-C-K-headshot-square.jpg',
    displayOrder: 5,
  },
  {
    name: 'Talitha Brumwell',
    title: 'Innovation Enablement Lead',
    bio: 'Talitha thrives at the intersection of people, learning, and innovation. She uses AI and emerging technologies to simplify complexity and empower others. She believes people learn best when they are having a little fun, so she brings clarity, momentum, and a warm spark of humor to every challenge she faces daily.',
    linkedIn: 'https://www.linkedin.com/in/talitha-brumwell-a24812250/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Talitha-Brumwell_Headshot_Square.jpg',
    displayOrder: 6,
  },
  {
    name: 'Tyler Clayton',
    title: 'Platform Steward - Digital Content Ecosystem',
    bio: 'Tyler has over 10 years of marketing and content experience, spanning roles from strategist and producer to writer and creative lead. As Platform Steward at SUCCESS, he drives the digital content ecosystem-scaling personal growth through AI innovation and collective impact.',
    linkedIn: 'https://www.linkedin.com/in/tyler-clayton-09848a8/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Tyler-Clayton_Headshot_Square.jpg',
    displayOrder: 7,
  },
  {
    name: 'Shawana Crayton',
    title: 'Business Admin & Customer Support Specialist',
    bio: 'Shawana has been with Success Enterprises for three years. With over 20 years of customer service experience, she finds joy in assisting others.',
    linkedIn: 'https://www.linkedin.com/in/shawana-crayton-786a6a117/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Shawana-Crayton_Headshot_square.jpg',
    displayOrder: 8,
  },
  {
    name: 'Carlos Gutierrez',
    title: 'Video Production Specialist',
    bio: 'Carlos is a seasoned Video Production Specialist with over 10 years of professional experience. He has collaborated with a diverse range of companies and brands, specializing in direct response video production that combines strategic messaging, compelling storytelling, and performance-driven visuals to engage audiences and drive measurable business results.',
    linkedIn: 'http://www.linkedin.com/in/carlos-gutierrez-06684524',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/11/SUCCESS_Carlos-Gutierrez_Headshot_Square.jpg',
    displayOrder: 9,
  },
  {
    name: 'Harmony Heslop',
    title: 'Departmental Support Specialist',
    bio: 'Harmony is a certified life coach and content operations specialist supporting course development, coaching coordination, and cross-departmental projects at SUCCESS. She bridges structure and strategy-helping align people, systems, and ideas to deliver programs that inspire growth and lasting transformation.',
    linkedIn: 'https://www.linkedin.com/in/harmony-heslop-b91a361/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Harmony-Heslop_Headshot_Square.jpg',
    displayOrder: 10,
  },
  {
    name: 'Emily Holombek',
    title: 'E-Learning & Enrichment Content Specialist',
    bio: 'Emily has a diverse background in startups, teaching, coaching, and curriculum development, with a strong focus on course design and implementation. Passionate about innovation, she thrives on creating engaging learning experiences and enhancing educational content that drives success and makes a meaningful impact.',
    linkedIn: 'https://www.linkedin.com/in/emily22holombek/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Emily-Holombek_Headshot_Square.jpg',
    displayOrder: 11,
  },
  {
    name: 'Elly Kang',
    title: 'Marketing Operations Assistant',
    bio: 'Driven by a passion for visual communication, Elly, who grew up in Korea, studied studio art at the University of Texas at Austin. With a strong interest in design and storytelling, she joined SUCCESS as a marketing operations assistant, where she contributes to creative projects and brand engagement.',
    linkedIn: 'https://www.linkedin.com/in/elly-kang-artist/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Elly-Kang_Headshot_Square.jpg',
    displayOrder: 12,
  },
  {
    name: 'Sarah Kuta',
    title: 'Copy Editor/Fact-Checker',
    bio: 'Sarah Kuta is a freelance writer and editor based in Longmont, Colorado. Her work has appeared in National Geographic, Conde Nast Traveler, Smithsonian magazine, AFAR, Travel+Leisure, NBC News, Food & Wine, Robb Report, and many other publications. She studied journalism at Northwestern University.',
    linkedIn: 'https://www.linkedin.com/in/sarah-kuta-74316614/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/04/Sarah-Kuta-headshot-square.jpg',
    displayOrder: 13,
  },
  {
    name: 'Virginia Le',
    title: 'Senior Production Manager',
    bio: 'Virginia is a detail-oriented individual responsible for overseeing numerous aspects, both significant and minor, in her role. Joining SUCCESS magazine\'s print production team in 2018, she ensures the Editorial Team stays on track, coordinates with printers, bulk customers, advertisers, vendors, and consultants to ensure timely magazine production.',
    linkedIn: 'https://www.linkedin.com/in/virginia-le-848313193/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Virginia_Le_headshot_square.jpg',
    displayOrder: 14,
  },
  {
    name: 'Denise Long',
    title: 'QC/Fact-Checker',
    bio: 'With over 20 years of professional experience in copy editing, writing, and fact-checking, Denise has worked with a variety of industries from news media and tech startups to academic institutions and nonprofits. At SUCCESS, she is a vigilant extra set of eyes for style and accuracy.',
    linkedIn: 'https://www.linkedin.com/in/denisehlong/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Denise-Long-headshot-square.jpg',
    displayOrder: 15,
  },
  {
    name: 'Jamie Lyons',
    title: 'Executive & Team Assistant',
    bio: 'Jamie has a wealth of experience in executive support, operations, and project management with a strong background in startup environments, where she\'s worn many hats beyond the traditional executive assistant role.',
    linkedIn: 'https://www.linkedin.com/in/jamielyons11/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Jamie-Lyons_Headshot_Square.jpg',
    displayOrder: 16,
  },
  {
    name: 'Rena Machani',
    title: 'Editorial Assistant',
    bio: 'Rena grew up in Colorado, graduated from The University of Colorado Boulder in English, and pursued media and journalism. She recently joined SUCCESS magazine as their editorial assistant.',
    linkedIn: 'https://www.linkedin.com/in/rena-machani-980744203/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/04/Rena-M-headshot-square.jpg',
    displayOrder: 17,
  },
  {
    name: 'Kristen McMahon',
    title: 'Customer Experience Specialist',
    bio: 'With over 15 years of experience in customer support and leadership, Kristen brings a deep understanding of building scalable, people-centered service operations. Her background spans operational strategy, team leadership, and customer advocacy across fast-growing organizations. At SUCCESS, she is committed to elevating service excellence, strengthening customer relationships, and supporting sustainable growth through thoughtful, empathetic leadership.',
    linkedIn: 'https://www.linkedin.com/in/kristen-mcmahon-6589541b0/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Kristen-McMahon_Headshot_Square.jpg',
    displayOrder: 18,
  },
  {
    name: 'Belle Mitchum',
    title: 'Marketing Editor',
    bio: 'Belle is a passionate marketing professional, experienced in managing diverse client portfolios and crafting tailored solutions across platforms. She holds an M.S. in Marketing from Clemson University and a B.B.A. in Management from Texas State University. She is dedicated to community leadership, creative collaboration, and elevating engagement through strategic storytelling.',
    linkedIn: 'https://www.linkedin.com/in/bellemitchum/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Belle-Mitchum_Headshot_Square.jpg',
    displayOrder: 19,
  },
  {
    name: 'Hugh Murphy',
    title: 'Product Development & Marketing Manager',
    bio: 'Hugh is a marketing professional with extensive career experience in the publishing and advertising industries.',
    linkedIn: 'https://www.linkedin.com/in/hugh-murphy-3774b94/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Hugh-Murphy-headshot-square.jpg',
    displayOrder: 20,
  },
  {
    name: "Emily O'Brien",
    title: 'Print Managing Editor',
    bio: 'Emily is the associate editor of SUCCESS magazine. She has contributed to more than 30 print and digital publications, focusing on architecture, wellness, travel, and lifestyle topics. She resides in Raleigh, North Carolina.',
    linkedIn: 'https://www.linkedin.com/in/emilyobrien/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Emily-OBrien-headshot-square.jpg',
    displayOrder: 21,
  },
  {
    name: 'Destinie Orndoff',
    title: 'Marketing Copywriter',
    bio: 'Destinie is a professional copywriter for SUCCESS and an indie filmmaker. A perpetually caffeinated marketing strategist and storyteller, she crafts impactful copy and articles designed to spark joy, believing the right words can inspire courage and meaningful change.',
    linkedIn: 'https://www.linkedin.com/in/destinie-orndoff-671b85299/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2024/11/SUCCESS_Destinie-Orndoff_Headshot_Square.jpg',
    displayOrder: 22,
  },
  {
    name: 'Staci Parks',
    title: 'Copy Editor/Fact-Checker',
    bio: 'Staci is SUCCESS magazine\'s copy editor and fact-checker. She\'s edited regional magazines, taught at the university level, and even did a stint as a small-town crime reporter at a Louisiana newspaper. She lives in Dallas, Texas, with her husband and two very adorable, very spoiled dogs.',
    linkedIn: 'https://www.linkedin.com/in/staci-parks/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2023/04/Staci-Parks-headshot-square.jpg',
    displayOrder: 23,
  },
  {
    name: 'Jazzlyn Torres',
    title: 'Communications Coordinator',
    bio: 'Jazzlyn is a New England based communications and marketing enthusiast who blends strategy and creativity together to bring SUCCESS to life. With a background in psychology and digital marketing, she crafts messages that engage, inspire and connect audiences-always curious, always learning, and always thinking about the next great story to tell.',
    linkedIn: 'https://www.linkedin.com/in/jazzlyn-sky-torres/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Jazzlyn-Torres_Headshot_Square.jpg',
    displayOrder: 24,
  },
  {
    name: 'Emily Tvelia',
    title: 'Marketing Operations Specialist',
    bio: 'Emily has diverse marketing and project management knowledge with experience using various platforms to build brands, improve engagement, and optimize marketing technology. She\'s passionate about learning something new every day and eager to help solve problems that increase marketing efficiency.',
    linkedIn: 'https://www.linkedin.com/in/emily-tvelia/',
    image: 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/01/SUCCESS_Emily-Tvelia_Headshot_Square.jpg',
    displayOrder: 25,
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await prisma.team_members.deleteMany({});

    const created = [];
    for (const member of teamMembers) {
      const teamMember = await prisma.team_members.create({
        data: {
          id: uuidv4(),
          ...member,
          isActive: true,
        },
      });
      created.push(teamMember);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${created.length} team members`,
      count: created.length,
    });
  } catch (error) {
    console.error('Error importing team members:', error);
    return res.status(500).json({ error: 'Failed to import team members' });
  }
}
