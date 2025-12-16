const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, 'backend', '.env');

console.log('Checking environment configuration...');

if (!fs.existsSync(envPath)) {
    console.error('❌ backend/.env file not found!');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const requiredKeys = [
    'RETELL_API_KEY',
    'RETELL_AGENT_ID',
    'GEMINI_API_KEY'
];

let hasErrors = false;

requiredKeys.forEach(key => {
    if (!envConfig[key] || envConfig[key].includes('your_')) {
        console.log(`❌ Missing or default value for: ${key}`);
        hasErrors = true;
    } else {
        console.log(`✅ Found: ${key}`);
    }
});

if (hasErrors) {
    console.log('\n⚠️  Please update backend/.env with valid keys and RESTART the server.');
} else {
    console.log('\n✅ Configuration looks good. Make sure to RESTART the server if you just changed these.');
}
