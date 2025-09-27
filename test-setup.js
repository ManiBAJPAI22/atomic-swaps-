#!/usr/bin/env node

// Simple test setup script to verify the CLI works
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Atomic Swap CLI Setup...\n');

try {
  // Test if TypeScript compiles
  console.log('📦 Building TypeScript...');
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ TypeScript compilation successful\n');

  // Test if CLI help works
  console.log('🔧 Testing CLI help...');
  execSync('node dist/index.js --help', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ CLI help command works\n');

  console.log('🎉 All tests passed! The CLI is ready to use.');
  console.log('\n📖 Usage:');
  console.log('  npm run dev interactive  # Interactive mode');
  console.log('  npm run dev evm-to-btc   # EVM to BTC swap');
  console.log('  npm run dev btc-to-evm   # BTC to EVM swap');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
