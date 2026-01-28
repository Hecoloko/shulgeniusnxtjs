
const fs = require('fs');
// Note: Actual newlines in the string literal
const key = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgvmf5TAmhPyuf6LDc
NiSFCj/fTsJc2Wgbj55I0R5QapChRANCAAR1O3kynyTK7JLnb+LZrLyArRvDedgI
3mWbbY2aklal4BCbKjsxuCGdMS+eL27RNvTf38jd5sKGkLC1ar8622zK
-----END PRIVATE KEY-----`;

fs.writeFileSync('clean_key.txt', key);
console.log("Written clean_key.txt");
