const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4321;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.connection.remoteAddress}`);
  
  let filePath = path.join(DIST_DIR, req.url);
  
  // Handle directory requests - look for index.html
  if (req.url.endsWith('/') || !path.extname(req.url)) {
    if (req.url.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    } else {
      filePath = path.join(filePath, 'index.html');
    }
  }
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, try adding .html extension
      if (!path.extname(filePath)) {
        filePath += '.html';
        fs.access(filePath, fs.constants.F_OK, (err2) => {
          if (err2) {
            console.log(`[${timestamp}] ❌ 404 - File not found: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          serveFile(filePath, res, timestamp);
        });
      } else {
        console.log(`[${timestamp}] ❌ 404 - File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }
    serveFile(filePath, res, timestamp);
  });
});

function serveFile(filePath, res, timestamp) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`[${timestamp}] ❌ 500 - Error reading file: ${filePath} - ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    
    const fileSize = data.length;
    console.log(`[${timestamp}] ✅ 200 - Served: ${path.basename(filePath)} (${fileSize} bytes, ${contentType})`);
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Length': fileSize
    });
    res.end(data);
  });
}

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}/`);
  console.log(`📱 Mobile: http://10.0.0.88:${PORT}/`);
  console.log(`📁 Serving files from: ${DIST_DIR}`);
  console.log(`🗺️ Map page: http://10.0.0.88:${PORT}/map/`);
  console.log('');
}); 