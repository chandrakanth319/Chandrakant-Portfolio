const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = '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';
const PORT = process.env.PORT || 3333;

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ── Serve portfolio HTML ──
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    serveFile(res, path.join(__dirname, 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  // ── AI Chat endpoint ──
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      let messages;
      try {
        messages = JSON.parse(body).messages;
        if (!messages || !Array.isArray(messages)) throw new Error('Invalid messages');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request: ' + e.message }));
        return;
      }

      const payload = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        temperature: 0.7,
        messages
      });

      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const groqReq = https.request(options, groqRes => {
        let data = '';
        groqRes.on('data', chunk => data += chunk);
        groqRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: parsed.error.message || 'Groq error' }));
              return;
            }
            const reply = parsed.choices?.[0]?.message?.content || 'No response.';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ reply }));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Parse error: ' + e.message }));
          }
        });
      });

      groqReq.on('error', e => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Network error: ' + e.message }));
      });

      groqReq.write(payload);
      groqReq.end();
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✅ Chandrakanth Portfolio running on port ${PORT}`);
  console.log(`👉 Open: http://localhost:${PORT}\n`);
});
