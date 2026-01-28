
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const key = fs.readFileSync('clean_key.txt', 'utf8');
const cliPath = path.join('node_modules', 'convex', 'dist', 'cli.bundle.cjs');

console.log("Setting key via Node spawn...");

// We use 'node' to run the CLI directly, bypassing shell scripts and npx
const child = spawn('node', [cliPath, 'env', 'set', 'JWT_PRIVATE_KEY', '--', key], {
    stdio: 'inherit'
});

child.on('close', (code) => {
    if (code === 0) console.log("SUCCESS!");
    else console.error("FAILED with code", code);
});
