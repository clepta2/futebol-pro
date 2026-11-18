import http from 'http';
import worker from '../worker.js';

const PORT = 8095;

const server = http.createServer(async (req, res) => {
  try {
    const fullUrl = `http://${req.headers.host || 'localhost:' + PORT}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    }

    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const workerReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body
    });

    const workerRes = await worker.fetch(workerReq, {});

    res.statusCode = workerRes.status;
    workerRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const buffer = Buffer.from(await workerRes.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor Futebol Pro Anycast ativo em http://localhost:${PORT}`);
});
