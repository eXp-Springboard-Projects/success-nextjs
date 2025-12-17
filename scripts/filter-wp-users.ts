import * as fs from 'fs';
import * as path from 'path';

interface WordPressUser {
  [key: string]: string;
}

function parseCSV(content: string): WordPressUser[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  const users: WordPressUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const user: WordPressUser = {};

    headers.forEach((header, index) => {
      user[header] = values[index] || '';
    });

    users.push(user);
  }

  return users;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function toCSV(users: WordPressUser[]): string {
  if (users.length === 0) return '';

  const headers = Object.keys(users[0]);
  const rows = [headers.join(',')];

  users.forEach(user => {
    const values = headers.map(header => {
      const value = user[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(values.join(','));
  });

  return rows.join('\n');
}

function isStaffEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@success.com');
}

function isActiveSubscriber(user: WordPressUser): boolean {
  // Check for various WordPress membership/subscription indicators
  const role = (user.role || user.roles || '').toLowerCase();
  const status = (user.status || user.subscription_status || '').toLowerCase();
  const membership = (user.membership || user.membership_level || '').toLowerCase();

  // Active subscriber indicators
  const isSubscriber = role.includes('subscriber') || role.includes('member');
  const hasActiveMembership = status.includes('active') || membership.includes('active');
  const isPaidMember = membership.includes('paid') || membership.includes('premium');

  return (isSubscriber && hasActiveMembership) || isPaidMember;
}

function hasRecentLogin(user: WordPressUser): boolean {
  const loginField = user.last_login || user.last_login_date || user.user_login_date || '';

  if (!loginField) {
    // If no login date, check user_registered as fallback
    const registered = user.user_registered || user.registered || '';
    if (!registered) return false;

    const registeredDate = new Date(registered);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return registeredDate >= twelveMonthsAgo;
  }

  const lastLoginDate = new Date(loginField);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return lastLoginDate >= twelveMonthsAgo;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/filter-wp-users.ts <input-csv-file>');
    console.error('Example: npx tsx scripts/filter-wp-users.ts data/wordpress-users.csv');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = inputFile.replace(/\.csv$/, '-filtered.csv');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('📊 WordPress User Filter\n');
  console.log(`Reading: ${inputFile}`);

  const content = fs.readFileSync(inputFile, 'utf-8');
  const users = parseCSV(content);

  console.log(`Total users: ${users.length}\n`);

  // Apply filters
  const filteredUsers = users.filter(user => {
    const email = user.email || user.user_email || '';

    // Keep if any of these conditions are true:
    // 1. Staff email (@success.com)
    // 2. Active subscriber (paid member)
    // 3. Recent login (last 12 months)

    const isStaff = isStaffEmail(email);
    const isSubscriber = isActiveSubscriber(user);
    const recentLogin = hasRecentLogin(user);

    return isStaff || isSubscriber || recentLogin;
  });

  // Calculate stats
  const staffCount = filteredUsers.filter(u => isStaffEmail(u.email || u.user_email || '')).length;
  const subscriberCount = filteredUsers.filter(u => isActiveSubscriber(u)).length;
  const recentLoginCount = filteredUsers.filter(u => hasRecentLogin(u)).length;

  console.log('Filter Results:');
  console.log('─'.repeat(50));
  console.log(`✓ Staff emails (@success.com):     ${staffCount}`);
  console.log(`✓ Active subscribers (paid):       ${subscriberCount}`);
  console.log(`✓ Recent logins (12 months):       ${recentLoginCount}`);
  console.log('─'.repeat(50));
  console.log(`\nFiltered ${users.length} down to ${filteredUsers.length} users\n`);

  // Write output
  const outputContent = toCSV(filteredUsers);
  fs.writeFileSync(outputFile, outputContent, 'utf-8');

  console.log(`✓ Written to: ${outputFile}`);

  // Show sample of removed users (for verification)
  const removedUsers = users.filter(user => {
    const email = user.email || user.user_email || '';
    const isStaff = isStaffEmail(email);
    const isSubscriber = isActiveSubscriber(user);
    const recentLogin = hasRecentLogin(user);
    return !isStaff && !isSubscriber && !recentLogin;
  });

  if (removedUsers.length > 0) {
    console.log(`\nRemoved ${removedUsers.length} users (inactive, no subscription, old login)`);
    console.log('Sample of removed users:');
    removedUsers.slice(0, 5).forEach(user => {
      const email = user.email || user.user_email || 'no-email';
      const login = user.last_login || user.user_registered || 'unknown';
      console.log(`  - ${email} (last activity: ${login})`);
    });
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
