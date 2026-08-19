/**
 * TTS Proxy Route
 * Proxies Google Translate TTS requests to bypass browser CORS restrictions.
 * The browser calls our backend, which fetches from Google and streams it back.
 */

const express = require('express');
const router = express.Router();
const https = require('https');

// GET /api/tts?text=hello&lang=ta
router.get('/', (req, res) => {
  const { text, lang } = req.query;

  if (!text || !lang) {
    return res.status(400).json({ error: 'text and lang are required' });
  }

  // Limit text length to prevent abuse
  const truncated = String(text).substring(0, 200);
  const encoded = encodeURIComponent(truncated);
  const langCode = String(lang).replace(/[^a-z-]/gi, ''); // sanitize

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${langCode}&client=tw-ob`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
      'Accept': '*/*',
    }
  };

  const googleReq = https.get(url, options, (googleRes) => {
    if (googleRes.statusCode !== 200) {
      return res.status(502).json({ error: 'Google TTS unavailable' });
    }

    // Stream audio back with correct headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');

    googleRes.pipe(res);
  });

  googleReq.on('error', (err) => {
    console.error('[TTS Proxy] Error:', err.message);
    res.status(502).json({ error: 'TTS proxy error' });
  });

  googleReq.setTimeout(8000, () => {
    googleReq.destroy();
    res.status(504).json({ error: 'TTS request timed out' });
  });
});

module.exports = router;
