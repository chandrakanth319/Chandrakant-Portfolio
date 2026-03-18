const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = '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';
const PORT = process.env.PORT || 8080;

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/health') { sendJSON(res, 200, { status: 'ok' }); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, html) => {
      if (err) { res.writeHead(500); res.end('index.html not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      let messages;
      try {
        messages = JSON.parse(body).messages;
        if (!Array.isArray(messages) || !messages.length) throw new Error('invalid');
      } catch(e) { sendJSON(res, 400, { error: 'Bad request' }); return; }

      const payload = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        temperature: 0.7,
        messages
      });

      const opts = {
        hostname: 'api.groq.com',
        port: 443,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 30000
      };

      const gr = https.request(opts, gres => {
        let data = '';
        gres.on('data', c => { data += c; });
        gres.on('end', () => {
          try {
            const p = JSON.parse(data);
            if (gres.statusCode !== 200) { sendJSON(res, 502, { error: p.error?.message || 'Groq error ' + gres.statusCode }); return; }
            const reply = p.choices?.[0]?.message?.content;
            if (!reply) { sendJSON(res, 502, { error: 'Empty Groq response' }); return; }
            sendJSON(res, 200, { reply });
          } catch(e) { sendJSON(res, 502, { error: 'Parse error: ' + e.message }); }
        });
      });

      gr.on('timeout', () => { gr.destroy(); sendJSON(res, 504, { error: 'Request timed out' }); });
      gr.on('error', e => { sendJSON(res, 502, { error: e.message }); });
      gr.write(payload);
      gr.end();
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Chandrakanth Portfolio running on port ' + PORT);
  console.log('👉 http://localhost:' + PORT);
});

server.on('error', e => { console.error('Server error:', e.message); process.exit(1); });
