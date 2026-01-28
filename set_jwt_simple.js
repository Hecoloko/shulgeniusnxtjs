
const { generateKeyPairSync } = require('crypto');
const { spawn } = require('child_process');
const os = require('os');

console.log("Generating 2048-bit RSA Key...");
const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Flatten to single line with literal \n
const flatKey = privateKey.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');

console.log("Setting JWT_PRIVATE_KEY...");
const cmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', flatKey], { stdio: 'inherit' });

child.on('close', (code) => {
    if (code === 0) {
        console.log("SUCCESS: JWT_PRIVATE_KEY set!");
    } else {
        console.error(`FAILURE: Exited with code ${code}`);
        process.exit(1);
    }
});
