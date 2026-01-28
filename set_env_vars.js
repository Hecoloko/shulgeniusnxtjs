
const { spawn } = require('child_process');
const os = require('os');

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC9FeDifxYI/2Gp
A6y+egfg/70SUjWXn0q5QSxQaeO+iXf2+7GGND+1w/A3Rp0/7tM9//GGSAvuyOxV
QixaRBauxe9MaoxrN3thqX5b3Rg1fnT3P5uaa5OzZYRXX2QqvmtJeCMsVbPIWiiT
3kl25YMNw6Tiq3r2n56UO1Nm3I7ZTd9NbW77dSJSFwaJocBjupGW/9gAMCpXqEdb
LrPQh9DO/UairWuEEeoi8z2mfcF9VzZIMEJYmTL0hNHBuaj8LOp6xXtvu6Uyr5lm
5LoRjHD4pEUVvUWwi7xSF8KmlnGiN6zoG7t5eQzhL5jtWk1HsYmBNB2h1YnQkqwD
id29htZhAgMBAAECggEABMO2PdLQt/OSbwczDT4nMGvVRG7Kn6pRgFNEdfbDGLgf
TBuJvL1YjSCVrxjiCbw/eaiXOgha9557uQbAthoQ3cDKT7lAFkwIuXxjPRaYP3HT
Ke9CAR08lKjGUcrLK/oOG0TyEvIKZI4kB1zSqlKsb5Z6U0VZpPj+7pKDnpwIY/CT
rEb6zr0Gf/APmRB2jPZoAhg3JJoAf2RpqAfzm4NyPe9Kb0+ain2whyRlIFZotlAw
UHSmB+2Movaidsc61pjzJ4U/2Z42CFpzhDAzEurMTHEqosuvYGA5QPFRDxIvBrib
1kuMnHB3YpegQGY27QzeHRl2BAb32h2XS/FYsHHgiQKBgQDh72PdXtz1l5/CoL45
JHcmKnOBUQFIyvUhlPNz+h/ugLSobY9pyufNdS4aNOw7NkHSrtR73I0S7IW4CGou
CR3RorEQg8oWINvJxtH6OpdPcYc+ayuKZw4YC8wcbDL4zilRH43eB+Lwpdjgjgzs
ArkyWdSt5XMJ/DP8Fv5J/C+3SQKBgQDWPy8DTl9wOhkVbCAG/z7ts2XCZSMzQ0WY
7QdGqfbVSHIlPEznkWd/eTXHV/v6eKDopNr0L1Ztz8wv2PGYn85bBhj43XpwiiWH
K2KuTdc8gNItSsYaOpLhCXUs+rHl8Kf6BJqrPNP41r81yAtjDMSJnmEulu4TsEIt
PCV5ePkuWQKBgGm3QqoNPiRoKue9oORJ7Lpd+KfUiF5QIPzynitxKMnHTUDV6tnc
iDP5lXXLt5FJJOl4xpGiNBxbsYHX5h7eQyaZEnKgx8ks3MqADjYgfjY878REDx52
dADKXFocQolqpaiAtDfkxspFP8JqlR9FcvRdVgd8KiTM7mIRPDDQIF+JAoGARA2D
0GgHlq1NpGlY7wAKrBRM4Wegu7rFk6LOqdp5Bhxh7YPu5athFbOZqn0/E7tXWS5s
Qh37NRxJPnWJoDI6qN0R95LaPn8TFpFoYfdlw9kjabGTpWcvmn2Xk7b55REBOkBW
JMhIiIUl7V5ih47ZquD8+4CDlQtqqdWuDZyogdkCgYBQlDM7MPT79Z+SyZnYT+oo
GOdzoqv1Q4gyfdYWcmM9lq7CjjkSgNt80E8wM+YX5JgbD9zHaNvGrGRHRGjOPzrA
6pf8mzCXASOITAAuOmvuYDtv9JlpyoDAJXXurOhvckV9nUwoW8tBwwT9StE1bXe2
yj1lHwUPDSrNgu+9RJwDUw==
-----END PRIVATE KEY-----`;

const resendKey = "re_jShnv3Hd_5sADe2h1R7WqVUXHnRMfNy7D";

const envs = [
    { key: "JWT_PRIVATE_KEY", val: privateKey },
    { key: "RESEND_API_KEY", val: resendKey },
    { key: "SMTP_HOST", val: "smtp.resend.com" },
    { key: "SMTP_PORT", val: "465" },
    { key: "SMTP_USER", val: "resend" },
    { key: "SMTP_PASS", val: resendKey },
];

async function setEnv(key, val) {
    return new Promise((resolve, reject) => {
        console.log(`Setting ${key}...`);
        // npx is a script, on windows we might need npx.cmd
        const cmd = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
        const child = spawn(cmd, ['convex', 'env', 'set', key, val], { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Failed to set ${key}, code ${code}`));
        });
    });
}

(async () => {
    for (const { key, val } of envs) {
        try {
            await setEnv(key, val);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }
    console.log("All env vars set!");
})();
