const { generateKeyPairSync } = require('crypto');
const { execSync } = require('child_process');

// Generate RSA key
const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log("Generated new RSA key");

try {
    // Use execSync to set it directly - this preserves newlines correctly
    execSync('npx convex env set JWT_PRIVATE_KEY -- "' + privateKey.replace(/"/g, '\\"') + '"', {
        stdio: 'inherit',
        shell: true
    });
    console.log("SUCCESS: Key set!");
} catch (e) {
    console.error("Failed:", e.message);
    // Fallback: write to file for manual setting
    require('fs').writeFileSync('MANUAL_KEY.txt', privateKey);
    console.log("\nKEY WRITTEN TO MANUAL_KEY.txt - You may need to set it manually via dashboard");
}
