require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

console.log('Testing database connectivity...\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET');

try {
  const result = execSync('npx prisma db pull --print', {
    env: { ...process.env },
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log('\n✅ Database is reachable');
  console.log(result);
} catch (error) {
  console.error('\n❌ Database connection failed');
  console.error(error.stderr || error.message);
  process.exit(1);
}
