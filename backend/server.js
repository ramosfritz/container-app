const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for testing flexibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running on Azure Container App',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
