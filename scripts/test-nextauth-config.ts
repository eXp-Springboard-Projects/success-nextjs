// Test NextAuth configuration
console.log('=== NextAuth Configuration Test ===\n');

console.log('Environment Variables:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('WORDPRESS_API_URL:', process.env.WORDPRESS_API_URL);

console.log('\nExpected Production Values:');
console.log('NEXTAUTH_URL should be: https://www.success.com');
console.log('NEXTAUTH_SECRET should be: gIi7IGU5xBhP8QHjeG58EIKAN0bpFWZaHPyI0hSQa4I=');
console.log('WORDPRESS_API_URL should be: https://successcom.wpenginepowered.com/wp-json/wp/v2');
