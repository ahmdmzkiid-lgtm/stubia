const http = require('http');

// Let's call the public upload image or document endpoint on localhost:3001 using a mock multipart body
const fs = require('fs');

async function testUpload() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  // Create a small mock buffer for a text/image file
  const fileContent = 'mock file content';
  const filename = 'test.txt';
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += `${fileContent}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="folder"\r\n\r\n`;
  body += `cvs\r\n`;
  body += `--${boundary}--\r\n`;

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/upload/public/document',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let resBody = '';
    res.on('data', (chunk) => resBody += chunk);
    res.on('end', () => {
      console.log('RESPONSE:', resBody);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

testUpload();
