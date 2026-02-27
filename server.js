const fs = require('fs');
const https = require('https');
const nStatic = require('node-static');
const fileServer = new nStatic.Server('./public');
const port = process.env.PORT || 443;
const host = process.env.HOST || '0.0.0.0';

let options;
try {
    options = {
        key:  fs.readFileSync('privkey.pem'),
        cert: fs.readFileSync('fullchain.pem'),
    };
} catch (err) {
    console.error('Failed to load SSL certificates. Ensure privkey.pem and fullchain.pem exist.', err.message);
    process.exit(1);
}

let server = https.createServer(options, function (req, res) {
    fileServer.serve(req, res);
});

server.listen(port, host, () => {
    console.log(`Server running at https://${host}:${port}/`);
});
