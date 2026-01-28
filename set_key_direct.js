
const { execFile } = require('child_process');
const path = require('path');

// The short ECDSA Key
const key = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgvmf5TAmhPyuf6LDc
NiSFCj/fTsJc2Wgbj55I0R5QapChRANCAAR1O3kynyTK7JLnb+LZrLyArRvDedgI
3mWbbY2aklal4BCbKjsxuCGdMS+eL27RNvTf38jd5sKGkLC1ar8622zK
-----END PRIVATE KEY-----
`;

// Path to local convex binary (Windows style)
const convexBin = path.join(__dirname, 'node_modules', '.bin', 'convex.cmd');

console.log("Setting JWT_PRIVATE_KEY using:", convexBin);

const child = execFile(convexBin, ['env', 'set', 'JWT_PRIVATE_KEY', key], (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Output:', stdout);
    console.error('Stderr:', stderr);
});
