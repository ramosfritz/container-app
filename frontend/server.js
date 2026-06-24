const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API proxy to bypass CORS and query the backend container internally
app.get('/api/status', async (req, res) => {
  try {
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/api/status`;
    console.log(`Forwarding healthcheck request to backend at: ${targetUrl}`);
    
    // 3-second fetch timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.json({ status: 'ok', backend: data });
    }
    return res.status(500).json({ status: 'error', message: `Backend returned status ${response.status}` });
  } catch (error) {
    console.error(`Error connecting to backend: ${error.message}`);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend proxy server running on port ${PORT}`);
  console.log(`Proxy target BACKEND_URL is set to: ${BACKEND_URL}`);
});
