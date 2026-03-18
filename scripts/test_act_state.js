/**
 * QUICK STATE TEST - Run just ACT with detailed logging
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing ACT State Fill ===');
console.log('Starting fill_google_places.js for ACT with detailed logging...\n');

const child = spawn('node', ['scripts/fill_google_places.js', '--empty-only', '--state', 'ACT'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
        ...process.env,
        DATABASE_URL: 'postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
    },
    stdio: 'inherit'
});

child.on('error', (error) => {
    console.error('Failed to start subprocess:', error);
});

child.on('close', (code) => {
    console.log(`\nProcess exited with code ${code}`);
    if (code === 0) {
        console.log('✅ ACT test completed successfully');
    } else {
        console.log('❌ ACT test failed');
    }
});

// Let it run for 2 minutes max then kill it
setTimeout(() => {
    if (!child.killed) {
        console.log('\n⏰ Timeout reached (2 minutes), killing process...');
        child.kill('SIGTERM');
    }
}, 120000);
