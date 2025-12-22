// Quick test script to verify environment variables are loaded
require('dotenv').config();

const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

console.log('🔍 Checking environment variables...\n');

let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first/last few chars for security
    const displayValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
      : '***';
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPresent) {
  console.log('✅ All environment variables are set correctly!');
  process.exit(0);
} else {
  console.log('❌ Some environment variables are missing!');
  process.exit(1);
}

