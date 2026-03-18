/**
 * TEST FIXED SCRIPT - Test the fixed fill_google_places.js with one suburb
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing Fixed Fill Script ===');
console.log('Running ACT Kambah Plumbing (should have results)...\n');

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
});

// Kill after 60 seconds
setTimeout(() => {
    if (!child.killed) {
        console.log('\n⏰ Timeout reached, killing process...');
        child.kill('SIGTERM');
    }
}, 60000);
