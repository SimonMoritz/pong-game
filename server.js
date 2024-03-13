const http = require('http');
const https = require('https')
const fs = require('fs');
const hostname = '178.128.255.58';
const hostname2 = '0.0.0.0';
const nStatic = require('node-static');
const fileServer = new nStatic.Server('./public');
const port = 443;
const port2 = 3002;

const options = {
	key: fs.readFileSync('privkey.pem'),
	cert: fs.readFileSync('fullchain.pem'),
}

let server = http.createServer(options, function (req, res) {
  fileServer.serve(req, res)
  if (req == '/'){
    fs.readFile('index.html', function(err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
  }
})


server.listen(port2, hostname2, () => {
  console.log(`Server running at http://${hostname2}:${port2}/`);
});
