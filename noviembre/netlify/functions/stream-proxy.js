const http = require('http');
const https = require('https');

const STREAM_URL = 'http://88.150.230.110:29986/stream';

exports.handler = async (event, context) => {
  return new Promise((resolve) => {
    const protocol = STREAM_URL.startsWith('https') ? https : http;
    
    const proxyReq = protocol.request(STREAM_URL, {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Mozilla/5.0'
      }
    }, (proxyRes) => {
      const headers = {
        'Content-Type': proxyRes.headers['content-type'] || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      };

      if (proxyRes.headers['content-length']) {
        headers['Content-Length'] = proxyRes.headers['content-length'];
      }

      resolve({
        statusCode: 206,
        headers,
        body: proxyRes,
        isBase64Encoded: false
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      resolve({
        statusCode: 502,
        body: JSON.stringify({ error: 'No se pudo conectar al stream' })
      });
    });

    proxyReq.end();
  });
};
