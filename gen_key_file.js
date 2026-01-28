
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const flatKey = privateKey.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
fs.writeFileSync('jwt_key.txt', flatKey);
console.log("Key written to jwt_key.txt");
