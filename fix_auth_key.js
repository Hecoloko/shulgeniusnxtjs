
const { generateKeyPairSync } = require('crypto');
const { spawn } = require('child_process');
const os = require('os');

console.log("Generating P-256 ECDSA Key (Short & Secure)...");
const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Flatten to single line for env var
const flatKey = privateKey.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
console.log("Key generated (Length: " + flatKey.length + ")");

console.log("Setting JWT_PRIVATE_KEY...");
// Use shell: true to help with command execution on Windows
const cmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', flatKey], {
    stdio: 'inherit',
    shell: true
});

child.on('close', (code) => {
    if (code === 0) {
        console.log("SUCCESS: JWT_PRIVATE_KEY set!");
    } else {
        console.error(`FAILURE: Exited with code ${code}`);
        process.exit(1);
    }
});
