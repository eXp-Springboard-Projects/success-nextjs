import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function importTeamMembers() {
  try {
    console.log('Fetching about-us page from WordPress...');

    const response = await fetch('https://successcom.wpenginepowered.com/about-us/');
    const html = await response.text();
    const $ = cheerio.load(html);

    const teamMembers: any[] = [];
    let displayOrder = 1;

    // Find all team member containers
    $('.team-member').each((index, element) => {
      const $member = $(element);

      // Extract name
      const firstName = $member.find('.jet-team-member__name-first').text().trim();
      const lastName = $member.find('.jet-team-member__name-last').text().trim();
      const name = `${firstName} ${lastName}`.trim();

      // Extract title/position
      const title = $member.find('.jet-team-member__position').text().trim().replace(/\s+/g, ' ');

      // Extract bio from the about-description section
      const bio = $member.find('.about-description .elementor-widget-text-editor p').last().text().trim();

      // Extract image URL
      const imageUrl = $member.find('.jet-team-member__img-tag').attr('src') ||
                      $member.find('.child-image img').attr('src') || '';

      // Extract LinkedIn URL
      const linkedInUrl = $member.find('a[href*="linkedin.com"]').attr('href') || '';

      if (name && title) {
        teamMembers.push({
          name,
          title,
          bio: bio || `${name} is ${title} at SUCCESS.`,
          image: imageUrl,
          linkedIn: linkedInUrl,
          displayOrder: displayOrder++,
          isActive: true,
        });
      }
    });

    console.log(`\nFound ${teamMembers.length} team members\n`);

    // Display what we found
    teamMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title}`);
      console.log(`   Image: ${member.image ? '✓' : '✗'}`);
      console.log(`   Bio: ${member.bio.substring(0, 80)}...`);
      console.log(`   LinkedIn: ${member.linkedIn || 'N/A'}`);
      console.log('');
    });

    // Clear existing team members
    console.log('Clearing existing team members...');
    await prisma.team_members.deleteMany({});

    // Insert new team members
    console.log('Inserting team members into database...');
    for (const member of teamMembers) {
      await prisma.team_members.create({
        data: member,
      });
    }

    console.log(`\n✓ Successfully imported ${teamMembers.length} team members!`);

  } catch (error) {
    console.error('Error importing team members:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importTeamMembers();
