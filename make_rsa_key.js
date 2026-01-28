
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

console.log("Generating 2048-bit RSA Key (Correct Algorithm)...");
const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// We keep the newlines real
const key = privateKey;

fs.writeFileSync('clean_key.txt', key);
console.log("Generated RSA key into clean_key.txt (Length: " + key.length + ")");
