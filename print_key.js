
const { generateKeyPairSync } = require('crypto');

const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const flatKey = privateKey.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
console.log("\n\n=== COPY THE LINE BELOW (INCL QUOTES) ===");
console.log(`"${flatKey}"`);
console.log("=========================================\n");
