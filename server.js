const fs = require('fs');
const https = require('https');
const express = require('express');

const app = express();
const port = process.env.PORT || 443;
const host = process.env.HOST || '0.0.0.0';

// Serve static files from public/
app.use(express.static('public'));

let options;
try {
    options = {
        key: fs.readFileSync('privkey.pem'),
        cert: fs.readFileSync('fullchain.pem'),
    };
} catch (err) {
    console.error('Failed to load SSL certificates. Ensure privkey.pem and fullchain.pem exist.', err.message);
    process.exit(1);
}

const server = https.createServer(options, app);

server.listen(port, host, () => {
    console.log(`Server running at https://${host}:${port}/`);
});
