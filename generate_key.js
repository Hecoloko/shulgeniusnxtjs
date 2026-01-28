
const { generateKeyPairSync } = require('crypto');

const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Remove newlines to make it easier to set as env var via command line if needed, 
// strictly though typically we want to preserve them. 
// However, for passing to `npx convex env set`, we need to be careful with newlines in Windows PowerShell.
// A safer bet is to print it, and I will read it and then set it using the tool which handles args better.
console.log(privateKey);
