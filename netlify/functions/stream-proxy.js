const fetch = require('node-fetch');

const STREAM_URL = 'http://88.150.230.110:29986/stream';

exports.handler = async (event) => {
  try {
    const response = await fetch(STREAM_URL, {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      compress: false
    });

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Connection': 'keep-alive'
      },
      body: response.body,
      isBase64Encoded: false
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'No se pudo conectar al stream', detalle: error.message })
    };
  }
};
