// pages/api/health.js
// Health check API

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    status: 'healthy',
    product: 'running-training-plan',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
